const db = require('ocore/db.js');


var assocTotalOnWalletsCache = {}
var assocTotalTransactionsCache = {}

function clearCaches(){
	assocTotalOnWalletsCache = {}
	assocTotalTransactionsCache = {}
}

function getTotalDepositedToWallets(arrIds, from_block, to_block ){
	return new Promise(async function(resolve){
		if (arrIds.length ===0)
			return resolve(0);
		const idsSqlFilter = arrIds.join(",");
		const rows = await db.query("SELECT SUM(transactions_to.amount) AS amount FROM transactions INNER JOIN transactions_from USING(id) \n\
		INNER JOIN transactions_to USING(id) WHERE transactions_to.wallet_id IN("+idsSqlFilter+") AND transactions_from.wallet_id NOT IN("+idsSqlFilter+") \n\
		AND transactions.block_height >=? AND transactions.block_height <=?",[from_block, to_block]);
		return resolve(rows[0] && rows[0].amount? rows[0].amount : 0);
	})
}

function getTotalWithdrawnFromWallets(arrIds, from_block, to_block ){
	return new Promise(async function(resolve){
		if (arrIds.length ===0)
			return resolve(0);
		const idsSqlFilter = arrIds.join(",");
		const rows = await db.query("SELECT SUM(transactions_from.amount) AS amount FROM transactions INNER JOIN transactions_from USING(id) \n\
		INNER JOIN transactions_to USING(id) WHERE transactions_to.wallet_id NOT IN("+idsSqlFilter+") AND transactions_from.wallet_id IN("+idsSqlFilter+") \n\
		AND transactions.block_height >=? AND transactions.block_height <=?",[from_block, to_block]);
		return resolve(rows[0] && rows[0].amount ? rows[0].amount : 0);
	})
}

function getTotalOnWallets(arrIds){
	return new Promise(async function(resolve){
		if (arrIds.length ===0)
			return resolve(0);
		const idsSqlFilter = arrIds.join(",");
		if (assocTotalOnWalletsCache[idsSqlFilter])
			var rows = assocTotalOnWalletsCache[idsSqlFilter];
		else {
			var rows = await db.query("SELECT (SELECT SUM(amount) FROM transactions_to WHERE wallet_id IN("+idsSqlFilter+")) - (SELECT SUM(amount) FROM transactions_from WHERE wallet_id IN("+idsSqlFilter+")) as amount");
			assocTotalOnWalletsCache[idsSqlFilter] = rows;
		}
		return resolve(rows[0] && rows[0].amount ? rows[0].amount : 0);
	})
}

function getTotalTransactions(arrIds){
	return new Promise(async function(resolve){
		if (arrIds.length ===0)
			return resolve(0);
		const idsSqlFilter = arrIds.join(",");
		if (assocTotalTransactionsCache[idsSqlFilter])
			var rows = assocTotalTransactionsCache[idsSqlFilter];
		else {
			var rows = await db.query("SELECT COUNT(DISTINCT id) AS count FROM (SELECT id FROM transactions_to WHERE wallet_id IN("+ idsSqlFilter +")\n\
			UNION SELECT id FROM transactions_from WHERE wallet_id IN("+ idsSqlFilter +"))s");
			assocTotalTransactionsCache[idsSqlFilter] = rows;
		}
		return resolve(rows[0] && rows[0].count ? rows[0].count : 0);
	});
}

function getTotalDepositAddresses(arrIds){
	return new Promise(async function(resolve){
		if (arrIds.length ===0)
			return resolve(0);
		const idsSqlFilter = arrIds.join(",");
		const rows = await db.query("SELECT count(id) as count FROM transactions INNER JOIN transactions_from USING(id) \n\
		INNER JOIN transactions_to USING(id) WHERE transactions_to.wallet_id IN("+idsSqlFilter+") AND transactions_from.wallet_id NOT IN("+idsSqlFilter+")");
		return resolve(rows[0] && rows[0].count ? rows[0].count : 0);
	})
}

function getTotalWithdrawalAddresses(arrIds){
	return new Promise(async function(resolve){
		if (arrIds.length ===0)
			return resolve(0);
		const idsSqlFilter = arrIds.join(",");
		const rows = await db.query("SELECT count(id) as count FROM transactions INNER JOIN transactions_from USING(id) \n\
		INNER JOIN transactions_to USING(id) WHERE transactions_from.wallet_id IN("+idsSqlFilter+") AND transactions_to.wallet_id NOT IN("+idsSqlFilter+")");
		return resolve(rows[0] && rows[0].count ? rows[0].count : 0);
	})
}


exports.getTotalDepositedToWallets = getTotalDepositedToWallets;
exports.getTotalWithdrawnFromWallets = getTotalWithdrawnFromWallets;
exports.getTotalOnWallets = getTotalOnWallets;
exports.getTotalDepositAddresses = getTotalDepositAddresses;
exports.getTotalWithdrawalAddresses = getTotalWithdrawalAddresses;
exports.getTotalTransactions = getTotalTransactions;
exports.clearCaches = clearCaches;