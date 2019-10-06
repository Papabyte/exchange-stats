const db = require('ocore/db.js');

const ITEMS_PER_PAGE = 100;

async function getTransactionsFromWallets(arrIds, page, handle){
	const idsSqlFilter = arrIds.join(",");
	console.error(idsSqlFilter);
	var idRows = await db.query("SELECT DISTINCT id from (SELECT id FROM transactions_to WHERE wallet_id IN("+ idsSqlFilter +") \n\
		UNION SELECT id FROM transactions_from WHERE wallet_id IN("+ idsSqlFilter +"))s");
console.error(idRows);
	const count_total = idRows.length;
	if (count_total == 0)
		return handle(null);

	idRows = idRows.splice(ITEMS_PER_PAGE * page, ITEMS_PER_PAGE * (page +1)).map(function(row){
		return row.id;
	});
	
	getTransactionsFromInternalIds(idRows, function(assocTxsFromWallet){
		return handle({count_total: count_total, txs: assocTxsFromWallet});
	});
}

async function getTransactionFromTxId(tx_id, handle){
	var idRows = await db.query("SELECT id from transactions WHERE tx_id=?",[tx_id]);
	if (idRows[0])
		getTransactionsFromInternalIds([idRows[0].id], handle);
	else
		return handle(null);
}

async function getWalletIdFromAddress(address, handle){
	const rows = await db.query("SELECT wallet_id FROM btc_addresses WHERE address=?",[address]);
	if (rows[0])
		return handle(rows[0].wallet_id)
	else
		return handle(null);
}


async function getTransactionsFromInternalIds(arrIds, handle){
	const idsSqlFilter = arrIds.join(",");
	console.error(idsSqlFilter);
	const rows = await db.query("SELECT transactions.block_height, datetime(block_time, 'unixepoch') as time,transactions.tx_id, transactions_from.amount AS amount_from,transactions_to.amount AS amount_to,\n\
	transactions_from.wallet_id AS from_id, transactions_to.wallet_id AS to_id,btc_addresses.address FROM transactions  \n\
	INNER JOIN transactions_to USING(id) \n\
	INNER JOIN processed_blocks USING(block_height) \n\
	INNER JOIN btc_addresses ON btc_addresses.id=transactions_to.address_id \n\
	LEFT JOIN transactions_from USING(id) \n\
	WHERE transactions.id IN (" +idsSqlFilter +") ORDER BY transactions.id DESC");

	console.error(JSON.stringify(rows));
	const assocTxsFromWallet = {};
	rows.forEach(function(row){
		if (!assocTxsFromWallet[row.tx_id]) {
			assocTxsFromWallet[row.tx_id] = {}
			assocTxsFromWallet[row.tx_id].to = [];
			assocTxsFromWallet[row.tx_id].height = row.block_height;
			assocTxsFromWallet[row.tx_id].time = row.time;
		}
			assocTxsFromWallet[row.tx_id].from = {id: row.from_id, amount: row.amount_from} ;
			assocTxsFromWallet[row.tx_id].to.push( {address: row.address, id: row.to_id, amount: row.amount_to}) ;
	});
	return handle(assocTxsFromWallet);
}


async function getRedirections(arrIds, handle){
	if (arrIds.length == 0)
		return handle([]);
		console.log("getRedirections");
		console.log(arrIds);
	const idsSqlFilter = arrIds.join(",");
	const rows = await db.query("SELECT DISTINCT(redirection_id) FROM (SELECT \n\
		CASE WHEN redirection IS NOT NULL THEN redirection \n\
		ELSE id \n\
		END redirection_id\n\
	 FROM btc_wallets WHERE id IN (" +idsSqlFilter +"))s");
	if (rows.length == 0){
		return handle(arrIds);
	} else {
		return handle(rows.map(function(row){return row.redirection_id}));
	}
}
exports.getTransactionsFromWallets = getTransactionsFromWallets;
exports.getRedirections = getRedirections;
exports.getTransactionFromTxId = getTransactionFromTxId;
exports.getWalletIdFromAddress = getWalletIdFromAddress;