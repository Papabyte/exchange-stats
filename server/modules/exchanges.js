const unsortedExchanges = require('../exchanges.json');
const explorer = require('./explorer.js');
const indexer = require('./indexer.js');
const stats = require('./stats.js');
const api = require('./coingecko_api.js');
const mutex = require('ocore/mutex.js');
const async = require('async');

const db = require('ocore/db.js');
var assocWalletIdsByExchange = null;

const assocExchanges = {};

// we sort assocExchanges by name
 Object.entries(unsortedExchanges)
.sort(function (a, b) {
	return a[1].name > b[1].name ? 1 : -1;
})
.forEach(function(arrKeyValue){
	assocExchanges[arrKeyValue[0]] = arrKeyValue[1];
});


processNewRanking();
setInterval(processNewRanking, 3*60*60*1000);

function processNewRanking(){
	mutex.lockOrSkip(["processNewRanking"], async function(unlock){
		if (!assocWalletIdsByExchange){
			unlock();
			console.log("assocWalletIdsByExchange not set yet");
			return setTimeout(processNewRanking, 1000); //wait that aa handler set assocWalletIdsByExchange
		}
		if (process.env.no_ranking_process)
			return unlock();
	
		for (var key in assocExchanges){
			if(assocWalletIdsByExchange[key]){
				var arrWalletIds = await explorer.getUniqueRedirections(assocWalletIdsByExchange[key]);
				// we await updateRankingRow to avoid to call coingecko API in parallel since that would trigger rate limiting
				await updateRankingRow(key, await createWeeklyHistoryForExchangeAndReturnMonthlyVolume(key, arrWalletIds));
			} else {
				await updateRankingRow(key, {});
			}
		}
		unlock();
	});
}

// update stats for 1 exchange, monthly_volume and trendString can be optionaly provided since they take time to be processed and we want to update
// ranking as soon as a wallet is added or removed
async function updateRankingRow(key, {monthly_volume, trendString}){
	console.log("update ranking row for " + key);
	var exchange = assocExchanges[key];
	if (!exchange)
		return;
	var total_24h_deposits = null;
	var total_24h_withdrawals = null;
	var total_btc_wallet = null;
	var nb_addresses = null;
	var objInfo = null;

	if (assocWalletIdsByExchange[key])
		var arrWalletIds = await explorer.getUniqueRedirections(assocWalletIdsByExchange[key]);

	if (arrWalletIds && arrWalletIds.length > 0){
		var lastHeight = await getYesterdayMidnightBlockHeight();
		total_24h_deposits = await stats.getTotalDepositedToWallets(arrWalletIds, lastHeight - 6 * 24 , lastHeight);
		total_24h_withdrawals = await stats.getTotalWithdrawnFromWallets(arrWalletIds, lastHeight - 6 * 24 , lastHeight);
		total_btc_wallet = await stats.getTotalOnWallets(arrWalletIds);
		nb_addresses = await stats.getAddressesCount(arrWalletIds);
	}
	if (assocExchanges[key].gecko_id)
		objInfo = await api.getExchangeInfo(assocExchanges[key].gecko_id);

	db.query("REPLACE INTO last_exchanges_ranking (exchange_id,trend,last_month_volume,nb_addresses,total_btc_wallet,name,last_day_deposits, last_day_withdrawals, reported_volume) VALUES (?,?,?,?,?,?,?,?,?)", 
	[
		key,
		trendString || null,
		monthly_volume || null,
		nb_addresses,
		total_btc_wallet, 
		exchange.name,
		total_24h_deposits, 
		total_24h_withdrawals,
		objInfo && objInfo.trade_volume_24h_btc_normalized ? Math.round(objInfo.trade_volume_24h_btc_normalized * 100000000) : null,
	]);
}

function getYesterdayMidnightBlockHeight(){
	return new Promise(async function(resolve){
		const rows = await db.query("SELECT MAX(block_height) as height FROM processed_blocks WHERE block_time<=strftime('%s', DATE('now', 'start of day', '-1 day'))");
		if (!rows[0]){
			console.log("yesterday midnight block not available, will process from last known block");
			var lastHeight = await indexer.getLastProcessedHeight();
		} else {
			var lastHeight = 	rows[0].height
			console.log("yesterday midnight height: " + lastHeight);
		}
		resolve(lastHeight);
	})
}


// create a table for each exchange and store on chain history in order to draw graphs
function createWeeklyHistoryForExchangeAndReturnMonthlyVolume(exchange, arrWalletIds){
	return new Promise(async function(resolve){
		console.log("create history for " + exchange);
		var tableName = "history_" + exchange;
		var tempTableName = "tmp_history_" + exchange;
		await db.query("DROP TABLE IF EXISTS " + tempTableName);
		await db.query("CREATE TABLE "+ tempTableName +" ( \n\
		week INTEGER PRIMARY KEY, \n\
		time_start INTEGER,\n\
		time_end INTEGER,\n\
		total_deposited INTEGER NOT NULL,\n\
		total_withdrawn INTEGER NOT NULL,\n\
		balance INTEGER NOT NULL)");

	
		var lastHeight = await getYesterdayMidnightBlockHeight();
			
		const start_ts = Date.now();
		const block_period_day = 6*24;
		const year_start_block = lastHeight - 365*6*24;
		const month_start_block = lastHeight - 30*6*24;
		const week_start_block = lastHeight - 7*6*24;
		const trendArray = [];
		var monthly_volume = 0;
		var balance = await stats.getTotalOnWallets(arrWalletIds);
		for (var i = lastHeight; i > year_start_block; i-= block_period_day){
			var block_start = i - block_period_day + 1;
			var total_deposited = await stats.getTotalDepositedToWallets(arrWalletIds, block_start, i );
			var total_withdrawn = await stats.getTotalWithdrawnFromWallets(arrWalletIds, block_start , i );
			balance -= await stats.getSumOutputsToWallets(arrWalletIds, block_start, i );
			balance += await stats.getSumInputsFromWallets(arrWalletIds, block_start, i );
			if (month_start_block < i)
				monthly_volume+= total_deposited + total_withdrawn;
			if (week_start_block < i)
				trendArray.push(total_deposited + total_withdrawn);

			await db.query("INSERT INTO "+ tempTableName +" (time_start,time_end,week,total_deposited,total_withdrawn,balance) VALUES (\n\
				(SELECT block_time FROM processed_blocks WHERE block_height=?),(SELECT block_time FROM processed_blocks WHERE block_height=?),?,?,?,?)",
				[block_start, i, i, total_deposited, total_withdrawn, balance]);
		}
		
		db.takeConnectionFromPool(function(conn) {
			var arrQueries = [];
			conn.addQuery(arrQueries, "BEGIN TRANSACTION");
			conn.addQuery(arrQueries,"DROP TABLE IF EXISTS " + tableName);
			console.log(tableName);
			conn.addQuery(arrQueries,"ALTER TABLE " + tempTableName + " RENAME TO " + tableName);
			conn.addQuery(arrQueries,"REPLACE INTO exchange_history_infos (exchange_id, wallets, processing_time) VALUES (?,?,?)", [exchange, arrWalletIds.join('@'), (Date.now() - start_ts)/1000]);
			conn.addQuery(arrQueries, "COMMIT");
			async.series(arrQueries, function() {
				conn.release();
				return resolve({monthly_volume: monthly_volume, trendString: trendArray.reverse().join('@')});
			});
		});
	})
}

async function getExchangeHistory(exchange, handle){
	const tableName = db.escape("history_" + exchange);
	const rows = await db.query("SELECT 1 FROM sqlite_master WHERE type='table' AND name="+tableName);
	if (rows[0]){
		const historyRows = await db.query("SELECT * FROM " + tableName);
		const infoRows = await db.query("SELECT creation_date,wallets FROM exchange_history_infos WHERE exchange_id=?",[exchange]);
		return handle({history: historyRows, info: infoRows[0]});
	} else {
		console.log("history " + tableName +" not found");
		return handle(null);
	}
}

function getLastRanking(handle){
	db.query("SELECT * FROM last_exchanges_ranking", function(rows){
		handle(rows);
	});
}

function getExchangeWalletIds(exchange){
	if(assocWalletIdsByExchange) // check for initialization
		return assocWalletIdsByExchange[exchange] || [];
	else
		return [];
}

function getExchangeName(exchange){
	if (assocExchanges[exchange] && assocExchanges[exchange].name)
		return assocExchanges[exchange].name;
	else
		return null;
}


function getExchangesList(){
	return assocExchanges;
}


function setWalletIdsByExchange(obj){
	assocWalletIdsByExchange = obj;
	for (var key in assocWalletIdsByExchange){
		if (assocExchanges[key])
			assocExchanges[key].has_wallet = true
	}
}


exports.getLastRanking = getLastRanking;
exports.getExchangeWalletIds = getExchangeWalletIds;
exports.getExchangesList = getExchangesList;
exports.getExchangeName = getExchangeName;
exports.setWalletIdsByExchange = setWalletIdsByExchange;
exports.getExchangeHistory = getExchangeHistory;
exports.updateRankingRow = updateRankingRow;