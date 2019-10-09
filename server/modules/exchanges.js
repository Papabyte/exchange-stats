const exchanges = require('../exchanges.json');
const indexer = require('./indexer.js');
const stats = require('./stats.js');
const api = require('./coingecko_api.js');

const db = require('ocore/db.js');

var assocWalletIdsByExchange = null;

processNewRanking();

async function processNewRanking(){

	if (!assocWalletIdsByExchange)
		return setTimeout(processNewRanking, 1000); //wait that aa handler set assocWalletIdsByExchange

	for (var key in exchanges){
		var exchange = exchanges[key];
		var total_24h_deposits=null;
		var total_24h_withdrawals=null;
		var total_btc_wallet=null;
		if (assocWalletIdsByExchange[exchange]){
			var arrWalletIds = assocWalletIdsByExchange[exchange];
			var lastHeight = await indexer.getLastProcessedHeight();
			total_24h_deposits = await stats.getTotalDepositedToWallets(arrWalletIds, lastHeight - 10 * 6 * 24 , lastHeight);
			total_24h_withdrawals = await stats.getTotalWithdrawnFromWallets(arrWalletIds, lastHeight - 10 * 6 * 24 , lastHeight);
			total_btc_wallet = await stats.getTotalOnWallets(arrWalletIds);
		}
		var objInfo = await api.getExchangeInfo(key);
console.log(	[
	key, 
	total_btc_wallet, 
	exchange.name,
	total_24h_deposits, 
	total_24h_withdrawals,
	objInfo && objInfo.trade_volume_24h_btc_normalized ? Math.round(objInfo.trade_volume_24h_btc_normalized * 100000000) : null
])
		db.query("REPLACE INTO last_exchanges_ranking (exchange_id,total_btc_wallet,name,last_day_deposits, last_day_withdrawals, cmc_volume) VALUES (?,?,?,?,?,?)", 
		[
			key, 
			total_btc_wallet, 
			exchange.name,
			total_24h_deposits, 
			total_24h_withdrawals,
			objInfo && objInfo.trade_volume_24h_btc_normalized ? Math.round(objInfo.trade_volume_24h_btc_normalized * 100000000) : null
		]);
	}
}

function getLastRanking(handle){
	db.query("SELECT * FROM last_exchanges_ranking", function(rows){
		handle(rows);
	});
}

function getExchangeWalletIds(exchange){
	console.log(assocWalletIdsByExchange);
	return assocWalletIdsByExchange[exchange] || [];
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