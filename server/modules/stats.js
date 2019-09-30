const db = require('ocore/db.js');


function getTotalDepositedToWallets(arrIds, from_block, to_block ){
	return new Promise(async function(resolve){
	const idsSqlFilter = arrIds.join("','");
	const rows = await db.query("SELECT SUM(transactions_to.amount) AS amount FROM transactions INNER JOIN transactions_from USING(id) \n\
	INNER JOIN transactions_to USING(id) WHERE transactions_to.wallet_id IN('"+idsSqlFilter+"') AND transactions_from.wallet_id NOT IN('"+idsSqlFilter+"') \n\
	AND transactions.block_height >=? AND transactions.block_height <=?",[from_block, to_block]);
	return resolve(rows[0] ? rows[0].amount : 0);
	})
}

function getTotalWithdrawnFromWallets(arrIds, from_block, to_block ){
	return new Promise(async function(resolve){
	const idsSqlFilter = arrIds.join("','");
	const rows = await db.query("SELECT SUM(transactions_from.amount) AS amount FROM transactions INNER JOIN transactions_from USING(id) \n\
	INNER JOIN transactions_to USING(id) WHERE transactions_to.wallet_id NOT IN('"+idsSqlFilter+"') AND transactions_from.wallet_id IN('"+idsSqlFilter+"') \n\
	AND transactions.block_height >=? AND transactions.block_height <=?",[from_block, to_block]);
	return resolve(rows[0] ? rows[0].amount : 0);
	})
}

exports.getTotalDepositedToWallets = getTotalDepositedToWallets;
exports.getTotalWithdrawnFromWallets = getTotalWithdrawnFromWallets