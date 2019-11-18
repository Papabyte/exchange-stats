const exchanges = require('../exchanges.json');
const explorer = require('./explorer.js');
const indexer = require('./indexer.js');
const stats = require('./stats.js');
const api = require('./coingecko_api.js');
const mutex = require('ocore/mutex.js');
const async = require('async');

const db = require('ocore/db.js');
var assocWalletIdsByExchange = null;

processNewRanking();
setInterval(processNewRanking, 60*60*1000);

function processNewRanking(){
	mutex.lockOrSkip(["processNewRanking"], async function(unlock){
		if (!assocWalletIdsByExchange){
			unlock();
			console.log("assocWalletIdsByExchange not set yet");
			return setTimeout(processNewRanking, 1000); //wait that aa handler set assocWalletIdsByExchange
		}
	
		for (var key in exchanges){
			var exchange = exchanges[key];
			var total_24h_deposits = null;
			var total_24h_withdrawals = null;
			var total_btc_wallet = null;
			var nb_deposit_addresses = null;
			var nb_withdrawal_addresses = null;
			var nb_addresses = null;
			var monthly_volume = null;
			var trendString = null;

			if (assocWalletIdsByExchange[key] && assocWalletIdsByExchange[key].length > 0){
				var arrWalletIds = await explorer.getRedirections(assocWalletIdsByExchange[key]);
				var lastHeight = await indexer.getLastProcessedHeight();
				total_24h_deposits = await stats.getTotalDepositedToWallets(arrWalletIds, lastHeight - 6 * 24 , lastHeight);
				total_24h_withdrawals = await stats.getTotalWithdrawnFromWallets(arrWalletIds, lastHeight - 6 * 24 , lastHeight);
				total_btc_wallet = await stats.getTotalOnWallets(arrWalletIds);
				nb_deposit_addresses = await stats.getTotalDepositAddresses(arrWalletIds);
				nb_withdrawal_addresses= await stats.getTotalWithdrawalAddresses(arrWalletIds);
				const volumeAndTrendObj = await createWeeklyHistoryForExchangeAndReturnMonthlyVolume(key, arrWalletIds);
				monthly_volume = volumeAndTrendObj.monthly_volume;
				trendString = volumeAndTrendObj.trend.join('@');
				nb_addresses = await stats.getAddressesCount(arrWalletIds);
			}
		var objInfo = await api.getExchangeInfo(exchanges[key].gecko_id);

			db.query("REPLACE INTO last_exchanges_ranking (exchange_id,trend,last_month_volume,nb_addresses,total_btc_wallet,name,last_day_deposits, last_day_withdrawals, reported_volume,nb_deposit_addresses,nb_withdrawal_addresses) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
			[
				key,
				trendString,
				monthly_volume,
				nb_addresses,
				total_btc_wallet, 
				exchange.name,
				total_24h_deposits, 
				total_24h_withdrawals,
				objInfo && objInfo.trade_volume_24h_btc_normalized ? Math.round(objInfo.trade_volume_24h_btc_normalized * 100000000) : null,
				nb_deposit_addresses,
				nb_withdrawal_addresses
			]);
		}
		unlock();
	});
}

function createWeeklyHistoryForExchangeAndReturnMonthlyVolume(exchange, arrWalletIds){
	return new Promise(async function(resolve){
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

		var lastHeight = await indexer.getLastProcessedHeight();
		const start_ts = Date.now();
		const block_period_day = 6*24;
		const year_start_block = lastHeight - 365*6*24;
		const month_start_block = lastHeight - 30*6*24;
		const week_start_block = lastHeight - 7*6*24;
		const trendArray = [];
		var monthly_volume = 0;
		var balance = await stats.getTotalOnWallets(arrWalletIds);
		for (var i = lastHeight; i > year_start_block; i-= block_period_day){
			console.log(exchange + " " + i);
			var block_start = i - block_period_day + 1;
			var total_deposited = await stats.getTotalDepositedToWallets(arrWalletIds, block_start, i );
			var total_withdrawn = await stats.getTotalWithdrawnFromWallets(arrWalletIds, block_start , i );
			balance -= total_deposited;
			balance +=  total_withdrawn;
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
				return resolve({monthly_volume: monthly_volume, trend: trendArray.reverse()});
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
	if (exchanges[exchange] && exchanges[exchange].name)
		return exchanges[exchange].name;
	else
		return null;
}


function getExchangesList(){
	const arrExchanges = [];
	for (var key in exchanges){
		arrExchanges.push({id: key, name: exchanges[key].name});
	}
	return arrExchanges;
}


function setWalletIdsByExchange(obj){
	assocWalletIdsByExchange = obj;
}

exports.getLastRanking = getLastRanking;
exports.getExchangeWalletIds = getExchangeWalletIds;
exports.getExchangesList = getExchangesList;
exports.getExchangeName = getExchangeName;
exports.setWalletIdsByExchange = setWalletIdsByExchange;
exports.getExchangeHistory = getExchangeHistory;