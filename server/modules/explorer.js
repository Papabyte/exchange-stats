const db = require('ocore/db.js');
const aa_handler = require("./aa_handler.js");
const stats = require("./stats.js");

const TXS_PER_PAGE = 20;
const ADDR_PER_PAGE = 100;
const OUTPUTS_PER_TX = 10;

async function getTransactionsFromWallets(arrIds, page, handle){
	const idsSqlFilter = arrIds.join(",");
	var [idRows, total_on_wallets, transactions_count] = await Promise.all([
		db.query("SELECT DISTINCT id FROM \n\
		(SELECT id FROM (SELECT id FROM transactions_to WHERE wallet_id IN("+ idsSqlFilter +") ORDER BY id DESC LIMIT 1000)s1 \n\
		UNION SELECT id FROM (SELECT id FROM transactions_from WHERE wallet_id IN("+ idsSqlFilter +") ORDER BY id DESC LIMIT 5000)s2)s ORDER BY id DESC LIMIT ?,?",[page*TXS_PER_PAGE,TXS_PER_PAGE]),
		stats.getTotalOnWallets(arrIds),
		stats.getTotalTransactions(arrIds)
	]);

	if (transactions_count == 0)
		return handle(null);

	idRows = idRows.map(function(row){
		return row.id;
	});
	const addr_count = await stats.getAddressesCount(arrIds);
	getTransactionsFromInternalIds(idRows, function(assocTxsFromWallet){
		return handle({
			per_page: TXS_PER_PAGE, 
			addr_count: addr_count, 
			total_on_wallets: total_on_wallets,
			count_total: transactions_count > 10000 ? 'over_10000' : transactions_count, 
			txs: assocTxsFromWallet});
	});
}

async function getAddressesFromWallet(id, page, handle){
	var [addressesRows, addr_count] = await Promise.all([
		db.query("SELECT address,balance FROM btc_addresses WHERE wallet_id=? ORDER BY balance DESC LIMIT ?,? ",[id,page*ADDR_PER_PAGE,ADDR_PER_PAGE]),
		stats.getAddressesCount([id])
	]);

	return handle({per_page: ADDR_PER_PAGE,addr_count: addr_count, addresses: addressesRows});
}


async function getTransactionFromTxId(tx_id, handle){
	const rows = await db.query("SELECT transactions.block_height, datetime(block_time, 'unixepoch') as time,transactions.tx_id, transactions_from.amount AS amount_from,transactions_to.amount AS amount_to,\n\
	transactions_from.wallet_id AS from_id, transactions_to.wallet_id AS to_id,btc_addresses.address FROM transactions  \n\
	INNER JOIN transactions_to USING(id) \n\
	INNER JOIN processed_blocks USING(block_height) \n\
	INNER JOIN btc_addresses ON btc_addresses.id=transactions_to.address_id \n\
	LEFT JOIN transactions_from USING(id) \n\
	WHERE transactions.tx_id =? ORDER BY transactions.id DESC",[tx_id]);
	if (rows[0])
	return handle(createTxsAssociativeArray(rows));
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
	console.log(idsSqlFilter);
	const rows = await db.query("SELECT transactions.block_height, datetime(block_time, 'unixepoch') as time,transactions.tx_id, transactions_from.amount AS amount_from,transactions_to.amount AS amount_to,\n\
	transactions_from.wallet_id AS from_id, transactions_to.wallet_id AS to_id,btc_addresses.address,n FROM transactions \n\
	INNER JOIN transactions_to USING(id) INNER JOIN processed_blocks USING(block_height) \n\
	INNER JOIN btc_addresses ON btc_addresses.id=transactions_to.address_id \n\
	LEFT JOIN transactions_from USING(id) \n\
	WHERE transactions.id IN (" +idsSqlFilter +") AND transactions_to.n <= ? ORDER BY transactions.id DESC",[OUTPUTS_PER_TX]);
	return handle(createTxsAssociativeArray(rows));
}

function createTxsAssociativeArray(rows){

	const assocTxsFromWallet = {};
	rows.forEach(function(row){
		if (row.n === OUTPUTS_PER_TX)
			return assocTxsFromWallet[row.tx_id].is_expandable = true;
		if (!assocTxsFromWallet[row.tx_id]) {
			assocTxsFromWallet[row.tx_id] = {}
			assocTxsFromWallet[row.tx_id].to = [];
			assocTxsFromWallet[row.tx_id].height = row.block_height;
			assocTxsFromWallet[row.tx_id].time = row.time;
		}

		assocTxsFromWallet[row.tx_id].from = {
			id: row.from_id,
			amount: row.amount_from,
			exchange: aa_handler.getExchangeByWalletId(row.from_id) 
		} ;
		assocTxsFromWallet[row.tx_id].to.push({
			address: row.address, id: row.to_id,
			amount: row.amount_to, 
			exchange: aa_handler.getExchangeByWalletId(row.to_id)
		}) ;
	});
	return assocTxsFromWallet;
}


function getRedirections(arrIds){
	return new Promise(async function(resolve){
		if (arrIds.length == 0)
			return resolve([]);
		const idsSqlFilter = arrIds.join(",");
		const rows = await db.query("SELECT DISTINCT(redirection_id) FROM (SELECT \n\
			CASE WHEN redirection IS NOT NULL THEN redirection \n\
			ELSE id \n\
			END redirection_id\n\
		FROM btc_wallets WHERE id IN (" +idsSqlFilter +"))s");
		if (rows.length == 0){
			return resolve(arrIds);
		} else {
			return resolve(rows.map(function(row){return row.redirection_id}));
		}
	});
}
exports.getTransactionsFromWallets = getTransactionsFromWallets;
exports.getRedirections = getRedirections;
exports.getTransactionFromTxId = getTransactionFromTxId;
exports.getWalletIdFromAddress = getWalletIdFromAddress;
exports.getAddressesFromWallet = getAddressesFromWallet;