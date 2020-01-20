const db = require('ocore/db.js');

var assocTotalOnWalletsCache = {}
var assocTotalTransactionsCache = {}

function clearCaches(){
	assocTotalOnWalletsCache = {}
	assocTotalTransactionsCache = {}
}

// sum outputs to a set of wallets ignoring those having inputs in this set of wallets
function getTotalDepositedToWallets(arrIds, from_block, to_block ){
	return new Promise(async function(resolve){
		if (arrIds.length ===0)
			return resolve(0);
		const idsSqlFilter = arrIds.join(",");
		var amount = 0;
		for (var i=from_block; i<=to_block; i++){
			const rows = await db.query("SELECT SUM(transactions_to.amount) AS amount FROM transactions INDEXED BY transactionsByBlockHeight INNER JOIN transactions_from  INDEXED BY fromByIdAndWalletId USING(id) \n\
			CROSS JOIN transactions_to INDEXED BY toByIdAndWalletId USING(id) WHERE transactions_to.wallet_id IN("+idsSqlFilter+") AND (transactions_from.wallet_id NOT IN("+idsSqlFilter+") OR transactions_from.wallet_id IS NULL)\n\
			AND transactions.block_height =?",[i]);
			amount+= (rows[0] && rows[0].amount ? rows[0].amount : 0);
		}
		return resolve(amount);
	})
}

// sum outputs having inputs matching a set of wallets while ignoring outpus to this set of wallets
function getTotalWithdrawnFromWallets(arrIds, from_block, to_block ){
	return new Promise(async function(resolve){
		if (arrIds.length ===0)
			return resolve(0);
		const idsSqlFilter = arrIds.join(",");
		var amount = 0;
		for (var i=from_block; i<=to_block; i++){
			const rows = await db.query("SELECT SUM(transactions_to.amount) AS amount FROM transactions INNER JOIN transactions_from USING(id) \n\
			CROSS JOIN transactions_to USING(id) WHERE (transactions_to.wallet_id IS NULL OR transactions_to.wallet_id NOT IN("+idsSqlFilter+")) AND transactions_from.wallet_id IN("+idsSqlFilter+") \n\
			AND transactions.block_height =?",[i]);
			amount+= (rows[0] && rows[0].amount ? rows[0].amount : 0);
		}
	return resolve(amount);
	})
}

// sum all outputs to a set of wallets
function getSumOutputsToWallets(arrIds, from_block, to_block ){
	return new Promise(async function(resolve){
		if (arrIds.length ===0)
			return resolve(0);
		const idsSqlFilter = arrIds.join(",");
		var amount = 0;
		for (var i=from_block; i<=to_block; i++){
			const rows = await db.query("SELECT SUM(transactions_to.amount) AS amount FROM transactions INDEXED BY transactionsByBlockHeight \n\
			CROSS JOIN transactions_to INDEXED BY toByIdAndWalletId USING(id) WHERE transactions_to.wallet_id IN("+idsSqlFilter+") \n\
			AND transactions.block_height =?",[i]);
			amount+= (rows[0] && rows[0].amount ? rows[0].amount : 0);
		}
		return resolve(amount);
	})
}

// sum all outputs from a set of wallets
function getSumInputsFromWallets(arrIds, from_block, to_block ){
	return new Promise(async function(resolve){
		if (arrIds.length ===0)
			return resolve(0);
		const idsSqlFilter = arrIds.join(",");
		var amount = 0;
		for (var i=from_block; i<=to_block; i++){
			const rows = await db.query("SELECT SUM(transactions_from.amount) AS amount FROM transactions INNER JOIN transactions_from USING(id) \n\
			WHERE transactions_from.wallet_id IN("+idsSqlFilter+") \n\
			AND transactions.block_height =?",[i]);
			amount+= (rows[0] && rows[0].amount ? rows[0].amount : 0);
		}
	return resolve(amount);
	})
}

// get total balances on a set of wallets
function getTotalOnWallets(arrIds){
	return new Promise(async function(resolve){
		if (arrIds.length ===0)
			return resolve(0);
		const idsSqlFilter = arrIds.join(",");
		if (assocTotalOnWalletsCache[idsSqlFilter])
			var rows = assocTotalOnWalletsCache[idsSqlFilter];
		else {
			var rows = await db.query("SELECT SUM(balance) AS amount FROM btc_wallets WHERE id IN("+idsSqlFilter+")");
			assocTotalOnWalletsCache[idsSqlFilter] = rows;
		}
		return resolve(rows[0] && rows[0].amount ? rows[0].amount : 0);
	})
}

// get total addresses count of a set of wallets
function getAddressesCount(arrIds){
	return new Promise(async function(resolve){
		if (arrIds.length ===0)
			return resolve(0);
		const idsSqlFilter = arrIds.join(",");
		var rows = await db.query("SELECT SUM(addr_count) AS count FROM btc_wallets WHERE id IN("+ idsSqlFilter +")");
		return resolve(rows[0] && rows[0].count ? rows[0].count : 0);
	});
}

// get total transactions involving a set of wallets, it is accurate only for transactions count below accurateTxsCountUpTo set in indexer
function getTotalTransactions(arrIds){
	return new Promise(async function(resolve){
		if (arrIds.length ===0)
			return resolve(0);
		const idsSqlFilter = arrIds.join(",");
		if (assocTotalTransactionsCache[idsSqlFilter])
			var rows = assocTotalTransactionsCache[idsSqlFilter];
		else {
			var rows = await db.query("SELECT SUM(txs_count) AS count FROM btc_wallets WHERE id IN("+ idsSqlFilter +")");
			assocTotalTransactionsCache[idsSqlFilter] = rows;
		}
		return resolve(rows[0] && rows[0].count ? rows[0].count : 0);
	});
}


exports.getTotalDepositedToWallets = getTotalDepositedToWallets;
exports.getTotalWithdrawnFromWallets = getTotalWithdrawnFromWallets;
exports.getTotalOnWallets = getTotalOnWallets;
exports.getSumOutputsToWallets = getSumOutputsToWallets;
exports.getSumInputsFromWallets = getSumInputsFromWallets;
exports.getTotalTransactions = getTotalTransactions;
exports.getAddressesCount = getAddressesCount;
exports.clearCaches = clearCaches;