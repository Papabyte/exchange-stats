const exchanges = require('../exchanges.json');
const indexer = require('./indexer.js');
const stats = require('./stats.js');

const db = require('ocore/db.js');


processNewRanking();

async function processNewRanking(){
	for (var key in exchanges){
		var exchange = exchanges[key];
		var total_24h_deposits;
		var total_24h_withdrawals;

		if (exchange.current_wallets){

			var arrWalletIds = exchange.current_wallets;
			var lastHeight = await indexer.getLastProcessedHeight();
			total_24h_deposits = await stats.getTotalDepositedToWallets(arrWalletIds, lastHeight - 10 * 6 * 24 , lastHeight);
			total_24h_withdrawals = await stats.getTotalWithdrawnFromWallets(arrWalletIds, lastHeight - 10 * 6 * 24 , lastHeight);

			db.query("REPLACE INTO last_exchanges_ranking (exchange_id,name,last_day_deposits, last_day_withdrawals) VALUES (?,?,?,?)", 
			[key, exchange.name,total_24h_deposits, total_24h_withdrawals]); 
		}
	}
}

function getLastRanking(handle){
	db.query("SELECT * FROM last_exchanges_ranking", function(rows){
		handle(rows);
	});
}

function getExchangeWalletIds(exchange){

	if (exchanges[exchange] && exchanges[exchange].current_wallets)
		return exchanges[exchange].current_wallets;
	else
		return [];
}

function getExchangesList(){
	const arrExchanges = []
	for (var key in exchanges){
		arrExchanges.push({id: key, name: exchanges[key].name});
	}
	return arrExchanges;
}

exports.getLastRanking = getLastRanking;
exports.getExchangeWalletIds = getExchangeWalletIds;
exports.getExchangesList = getExchangesList;