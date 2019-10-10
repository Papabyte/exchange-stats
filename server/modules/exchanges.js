const exchanges = require('../exchanges.json');
const indexer = require('./indexer.js');
const stats = require('./stats.js');
const api = require('./coingecko_api.js');
const mutex = require('ocore/mutex.js');


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
			console.log("assocWalletIdsByExchange");
			console.log(assocWalletIdsByExchange);

		for (var key in exchanges){
			var exchange = exchanges[key];
			var total_24h_deposits=null;
			var total_24h_withdrawals=null;
			var total_btc_wallet=null;
			var nb_deposit_addresses=null;
			var nb_withdrawal_addresses=null;

			if (assocWalletIdsByExchange[key]){
				var arrWalletIds = assocWalletIdsByExchange[key];
				var lastHeight = await indexer.getLastProcessedHeight();
				total_24h_deposits = await stats.getTotalDepositedToWallets(arrWalletIds, lastHeight - 10 * 6 * 24 , lastHeight);
				total_24h_withdrawals = await stats.getTotalWithdrawnFromWallets(arrWalletIds, lastHeight - 10 * 6 * 24 , lastHeight);
				total_btc_wallet = await stats.getTotalOnWallets(arrWalletIds);
				nb_deposit_addresses = await stats.getTotalDepositAddresses(arrWalletIds);
				nb_withdrawal_addresses= await stats.getTotalWithdrawalAddresses(arrWalletIds);
			}
			var objInfo = await api.getExchangeInfo(key);
	console.log(	[
		key, 
		total_btc_wallet, 
		exchange.name,
		total_24h_deposits, 
		total_24h_withdrawals,
		objInfo && objInfo.trade_volume_24h_btc_normalized ? Math.round(objInfo.trade_volume_24h_btc_normalized * 100000000) : null,
		nb_deposit_addresses,
		nb_withdrawal_addresses
	])
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