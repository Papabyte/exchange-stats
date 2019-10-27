const db = require('ocore/db.js');

exports.create = function(){
	return new Promise(async function(resolve){
		console.error("will create tables if not exist");
		await db.query("CREATE TABLE IF NOT EXISTS btc_addresses (\n\
			id INTEGER PRIMARY KEY, \n\
			address VARCHAR(70) UNIQUE, \n\
			wallet_id INTEGER)");
		await db.query("CREATE INDEX IF NOT EXISTS byWalletId ON btc_addresses(wallet_id) WHERE wallet_id IS NOT NULL");

		await db.query("CREATE TABLE IF NOT EXISTS btc_wallets (\n\
			id INTEGER PRIMARY KEY AUTOINCREMENT,\n\
			addr_count INTEGER DEFAULT 1, \n\
			redirection INTEGER\n\
			)");
		await db.query("CREATE INDEX IF NOT EXISTS walletByRedirection ON btc_wallets(redirection) WHERE redirection IS NOT NULL");

		await db.query("CREATE TABLE IF NOT EXISTS transactions (\n\
			id INTEGER PRIMARY KEY AUTOINCREMENT, \n\
			tx_id CHAR(64) UNIQUE NOT NULL,\n\
			block_height INTEGER NOT NULL\n\
			)");
		await db.query("CREATE INDEX IF NOT EXISTS transactionsByBlockHeight ON transactions(block_height)");

		await db.query("CREATE TABLE IF NOT EXISTS transactions_from (\n\
			id INTEGER PRIMARY KEY, \n\
			wallet_id INTEGER,\n\
			amount INTEGER NOT NULL)");
		await db.query("CREATE INDEX IF NOT EXISTS fromByWalletId ON transactions_from(wallet_id) WHERE wallet_id IS NOT NULL");

		await db.query("CREATE TABLE IF NOT EXISTS transactions_to (\n\
			id INTEGER, \n\
			wallet_id INTEGER,\n\
			address_id INTEGER,\n\
			amount INTEGER NOT NULL,\n\
			n SMALLINT NOT NULL\n\
			)");

		await db.query("CREATE INDEX IF NOT EXISTS toByWalletId ON transactions_to(wallet_id ,address_id)");
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
			reported_volume INTEGER,\n\
			nb_deposit_addresses INTEGER,\n\
			nb_withdrawal_addresses INTEGER,\n\
			total_btc_wallet INTEGER,\n\
			last_day_deposits INTEGER,\n\
			last_day_withdrawals INTEGER,\n\
			delivered_by_traded\n\
			)");

		await db.query("CREATE TABLE IF NOT EXISTS operations_history (\n\
			operation_id VARCHAR(60) NOT NULL, \n\
			pair VARCHAR(46) NOT NULL, \n\
			operation_type VARCHAR(30) NOT NULL, \n\
			concerned_address CHAR(32) NOT NULL, \n\
			paid_in INTEGER DEFAULT 0,\n\
			paid_out INTEGER DEFAULT 0,\n\
			mci INT NOT NULL, \n\
			aa_address CHAR(32) NOT NULL, \n\
			response TEXT NULL, \n\
			trigger_unit CHAR(44) NOT NULL, \n\
			timestamp INTEGER NOT NULL, \n\
			UNIQUE (trigger_unit, aa_address) \n\
			)");

		await db.query("CREATE INDEX IF NOT EXISTS operationsHistoryByMci ON operations_history(mci)");
		await db.query("CREATE INDEX IF NOT EXISTS operationsHistoryByPair ON operations_history(pair)");
		await db.query("CREATE INDEX IF NOT EXISTS operationsHistoryByOperationId ON operations_history(operation_id)");
		await db.query("CREATE INDEX IF NOT EXISTS operationsHistoryByConcernedAddress ON operations_history(concerned_address)");

	console.error("all tables created");
	resolve();
	});

}