const exchanges = require('../exchanges.json');
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
			return setTimeout(processNewRanking, 1000); //wait that aa handler set assocWalletIdsByExchange
		}
	
		for (var key in exchanges){
			var exchange = exchanges[key];
			var total_24h_deposits=null;
			var total_24h_withdrawals=null;
			var total_btc_wallet=null;
			var nb_deposit_addresses=null;
			var nb_withdrawal_addresses=null;

			if (assocWalletIdsByExchange[key] && assocWalletIdsByExchange[key].length > 0){
				var arrWalletIds = assocWalletIdsByExchange[key];
				var lastHeight = await indexer.getLastProcessedHeight();
				total_24h_deposits = await stats.getTotalDepositedToWallets(arrWalletIds, lastHeight - 10 * 6 * 24 , lastHeight);
				total_24h_withdrawals = await stats.getTotalWithdrawnFromWallets(arrWalletIds, lastHeight - 10 * 6 * 24 , lastHeight);
				total_btc_wallet = await stats.getTotalOnWallets(arrWalletIds);
				nb_deposit_addresses = await stats.getTotalDepositAddresses(arrWalletIds);
				nb_withdrawal_addresses= await stats.getTotalWithdrawalAddresses(arrWalletIds);
				await createWeeklyHistoryForExchange(key, arrWalletIds);
			}
			var objInfo = await api.getExchangeInfo(key);

			db.query("REPLACE INTO last_exchanges_ranking (exchange_id,total_btc_wallet,name,last_day_deposits, last_day_withdrawals, reported_volume,nb_deposit_addresses,nb_withdrawal_addresses) VALUES (?,?,?,?,?,?,?,?)", 
			[
				key, 
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

function createWeeklyHistoryForExchange(exchange, arrWalletIds){
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
	const block_period = 6*24*7;
	var balance = 0;
	for (var i = 0; i < lastHeight; i+= block_period){
		var total_deposited = await stats.getTotalDepositedToWallets(arrWalletIds, i, i + block_period);
		balance += total_deposited;
		var total_withdrawn = await stats.getTotalWithdrawnFromWallets(arrWalletIds, i, i + block_period);
		balance -= total_withdrawn;
		var total_withdrawn = await stats.getTotalWithdrawnFromWallets(arrWalletIds, i, i + block_period);
		await db.query("INSERT INTO "+ tempTableName +" (time_start,time_end,week,total_deposited,total_withdrawn,balance) VALUES (\n\
			(SELECT block_time FROM processed_blocks WHERE block_height=?),(SELECT block_time FROM processed_blocks WHERE block_height=?),?,?,?,?)",
			[i,i + block_period,i,total_deposited,total_withdrawn,balance]);
	}
			db.takeConnectionFromPool(function(conn) {
				var arrQueries = [];
				conn.addQuery(arrQueries, "BEGIN TRANSACTION");
				conn.addQuery(arrQueries,"DROP TABLE IF EXISTS " + tableName);
				console.log(tableName);
				conn.addQuery(arrQueries,"ALTER TABLE " + tempTableName + " RENAME TO " + tableName);
				conn.addQuery(arrQueries, "COMMIT");
				async.series(arrQueries, function() {
					conn.release();
					return resolve();
				});
			});
		
	})
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