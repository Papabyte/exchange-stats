const db = require('ocore/db.js');
const aa_handler = require("./aa_handler.js");
const stats = require("./stats.js");

const ITEMS_PER_PAGE = 20;

async function getTransactionsFromWallets(arrIds, page, handle){
	const idsSqlFilter = arrIds.join(",");
	var [idRows, total_on_wallets, transactions_count] = await Promise.all([
		db.query("SELECT DISTINCT id FROM \n\
		(SELECT id FROM (SELECT id FROM transactions_to WHERE wallet_id IN("+ idsSqlFilter +") ORDER BY id DESC LIMIT 1000)s1 \n\
		UNION SELECT id FROM (SELECT id FROM transactions_from WHERE wallet_id IN("+ idsSqlFilter +") ORDER BY id DESC LIMIT 5000)s2)s ORDER BY id DESC LIMIT ?,?",[page*ITEMS_PER_PAGE,ITEMS_PER_PAGE]),
		stats.getTotalOnWallets(arrIds),
		stats.getTotalTransactions(arrIds)
	]);

	/*
		db.query("SELECT DISTINCT id FROM (SELECT id FROM transactions_to WHERE wallet_id IN("+ idsSqlFilter +") \n\
		UNION SELECT id FROM transactions_from WHERE wallet_id IN("+ idsSqlFilter +"))s ORDER BY id DESC LIMIT ?,?",[page*ITEMS_PER_PAGE,ITEMS_PER_PAGE]),
		stats.getTotalOnWallets(arrIds),
*/
	if (transactions_count == 0)
		return handle(null);

	idRows = idRows.map(function(row){
		return row.id;
	});
	getTransactionsFromInternalIds(idRows, function(assocTxsFromWallet){
		return handle({total_on_wallets: total_on_wallets,count_total: transactions_count, txs: assocTxsFromWallet});
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

		assocTxsFromWallet[row.tx_id].from = {
			id: row.from_id,
			amount: row.amount_from,
			exchange: aa_handler.getCurrentExchangeByWalletId(row.from_id) 
		} ;
		assocTxsFromWallet[row.tx_id].to.push({
			address: row.address, id: row.to_id,
			amount: row.amount_to, 
			exchange: aa_handler.getCurrentExchangeByWalletId(row.to_id)
		}) ;
	});
	return handle(assocTxsFromWallet);
}


async function redirections(arrIds, handle){
	if (arrIds.length == 0)
		return handle([]);
		console.log("redirections");
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
exports.redirections = redirections;
exports.getTransactionFromTxId = getTransactionFromTxId;
exports.getWalletIdFromAddress = getWalletIdFromAddress;