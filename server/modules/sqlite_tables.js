const db = require('ocore/db.js');

exports.create = function(){
	return new Promise(async function(resolve){
	console.error("will create tables if not exist");
	await db.query("CREATE TABLE IF NOT EXISTS btc_addresses (\n\
		id INTEGER PRIMARY KEY, \n\
		address VARCHAR(70) UNIQUE, \n\
		wallet_id INTEGER)");
	await db.query("CREATE INDEX IF NOT EXISTS byWalletId ON btc_addresses(wallet_id)");

	await db.query("CREATE TABLE IF NOT EXISTS redirections (\n\
		from_id INTEGER PRIMARY KEY, \n\
		to_id INTEGER)");

	await db.query("CREATE TABLE IF NOT EXISTS btc_wallets (\n\
		id INTEGER PRIMARY KEY AUTOINCREMENT,\n\
		addr_count INTEGER DEFAULT 1)");

	await db.query("CREATE TABLE IF NOT EXISTS transactions (\n\
		id INTEGER PRIMARY KEY AUTOINCREMENT, \n\
		tx_id CHAR(64) UNIQUE NOT NULL,\n\
		block_height INTEGER NOT NULL\n\
		)");
	await db.query("CREATE INDEX IF NOT EXISTS transactionsByBlockHeight ON transactions(block_height)");

	await db.query("CREATE TABLE IF NOT EXISTS transactions_from (\n\
		id INTEGER PRIMARY KEY, \n\
		wallet_id INTEGER NOT NULL,\n\
		amount INTEGER NOT NULL)");
	await db.query("CREATE INDEX IF NOT EXISTS fromByWalletId ON transactions_from(wallet_id)");

	await db.query("CREATE TABLE IF NOT EXISTS transactions_to (\n\
		id INTEGER, \n\
		wallet_id INTEGER,\n\
		address_id INTEGER,\n\
		amount INTEGER NOT NULL,\n\
		n INTEGER NOT NULL\n\
		)");
		
	await db.query("CREATE INDEX IF NOT EXISTS toByWalletId ON transactions_to(wallet_id)");
	await db.query("CREATE UNIQUE INDEX IF NOT EXISTS toById ON transactions_to(id,n)");
	await db.query("CREATE INDEX IF NOT EXISTS toByAddressId ON transactions_to(address_id)");

	await db.query("CREATE TABLE IF NOT EXISTS processed_blocks (\n\
		block_height INTEGER  PRIMARY KEY, \n\
		block_time INTEGER,\n\
		tx_index INTEGER NOT NULL )")
	await db.query("INSERT OR IGNORE INTO processed_blocks (block_height,tx_index) VALUES (0,-1)");
	if (process.env.delete)
		await db.query("PRAGMA journal_mode=DELETE");
	else
		await db.query("PRAGMA journal_mode=WAL");

	await db.query("CREATE TABLE IF NOT EXISTS last_exchanges_ranking (\n\
		exchange_id VARCHAR(60) PRIMARY KEY, \n\
		name VARCHAR(60),\n\
		cmc_volume INTEGER,\n\
		nb_users INTEGER,\n\
		total_btc_wallet INTEGER,\n\
		last_day_deposits INTEGER,\n\
		last_day_withdrawals INTEGER,\n\
		delivered_by_traded,\n\
		mau \n\
		)");
		console.error("all tables created");
		resolve();
	});

}