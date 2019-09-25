/*jslint node: true */
"use strict";
const db = require('ocore/db.js');
const request = require('request');
const async = require('async');
const crypto = require('crypto');
const mutex = require('ocore/mutex.js');

(async function(){
	await db.query("CREATE TABLE IF NOT EXISTS btc_addresses (\n\
	address VARCHAR(70) PRIMARY KEY, \n\
	wallet_id CHAR(20))");
	await db.query("CREATE INDEX IF NOT EXISTS byWalletId ON btc_addresses(wallet_id)");
	await db.query("CREATE TABLE IF NOT EXISTS redirections (\n\
		from_id CHAR(20) PRIMARY KEY, \n\
		to_id CHAR(20))");

	await db.query("CREATE TABLE IF NOT EXISTS transactions (\n\
		id INTEGER PRIMARY KEY AUTOINCREMENT, \n\
		tx_id CHAR(64) UNIQUE NOT NULL,\n\
		block_height INTEGER NOT NULL\n\
		)");
	await db.query("CREATE TABLE IF NOT EXISTS transaction_from (\n\
		id INTEGER PRIMARY KEY, \n\
		wallet_id CHAR(20) NOT NULL,\n\
		amount INTEGER NOT NULL)");
	await db.query("CREATE INDEX IF NOT EXISTS fromByWalletId ON transaction_from(wallet_id)");

	await db.query("CREATE TABLE IF NOT EXISTS transaction_to (\n\
		id INTEGER, \n\
		wallet_id CHAR(20),\n\
		address VARCHAR(70),\n\
		amount INTEGER NOT NULL)");
	await db.query("CREATE INDEX IF NOT EXISTS toByWalletId ON transaction_to(wallet_id)");
	await db.query("CREATE INDEX IF NOT EXISTS toByAddress ON transaction_to(address)");


	await db.query("CREATE TABLE IF NOT EXISTS blocks_processed (\n\
		block_height INTEGER  PRIMARY KEY, \n\
		block_time INTEGER,\n\
		tx_index INTEGERNOT NULL )")
	await db.query("REPLACE INTO blocks_processed (block_height,tx_index) VALUES (400000,0)");

	const rows = await db.query("SELECT MAX(block_height) as height,tx_index FROM blocks_processed");
	console.error("catchup from block " + rows[0].height + " tx index " + rows[0].tx_index);
	var nextBlock = await downloadNextWhileProcessing(rows[0].height, rows[0].tx_index);
	for (var i = rows[0].height+1; i<600000; i++){
		nextBlock = await	downloadNextWhileProcessing(i, 0, nextBlock);
	}
})();

async function processBlock(objBlock, start_tx_index, handle){
		console.error("block " + objBlock.height + "txs in this block: " + objBlock.tx.length + " start_tx_index " + start_tx_index);
		objBlock.tx.sort(function(a,b){
			if (a.hash > b.hash)
				return 1;
			else
				return -1;
		});

		async.eachOfSeries(objBlock.tx,  function(tx, tx_index, callback){
			if (tx_index <=start_tx_index)
				return callback();
			var input_addresses = [];
			var value_in = 0;
			tx.inputs.forEach(function(input){
				if (!input.prev_out || !input.prev_out.addr) // coinbase
					return;
				input_addresses.push(input.prev_out.addr);
				value_in+=input.prev_out.value;
			})
			input_addresses = [...new Set(input_addresses)];
			input_addresses.sort();
			var wallet_ids = [];
			input_addresses.forEach(function(address){
				wallet_ids.push(crypto.createHash("ripemd160").update(address, "utf8").digest().toString('hex'));
			})
			wallet_ids.sort();

			var outputs = [];
			tx.out.forEach(function(output){
				outputs.push({address: output.addr, value:output.value});
			});
			if (input_addresses.length == 0){
				(async function(){
				await saveTransactions(tx.hash, objBlock.height, null ,value_in,outputs)
				})();
				return callback();
			}
			//it looks eachOfSeries doesn't work serially anymore with async function, so we wrap in anonymous function
			(async function(){
				await Promise.all([saveInputAddresses(input_addresses, wallet_ids[0]), saveTransactions(tx.hash, objBlock.height, wallet_ids[0],value_in,outputs)]);
				await mergeWalletIds(input_addresses, objBlock.height,objBlock.time, tx_index);// we merge these input addresses in the wallet id that has already the most addresses and set up redirections
				callback()	
			})();
		}, function(){
			console.error("block " + objBlock.height + " processed");
			return handle();
		});
}

function saveTransactions(tx_id, height, from_wallet_id, value_in, outputs){
	return new Promise(function(resolve){
		db.takeConnectionFromPool(function(conn) {
			var arrQueries = [];
			conn.addQuery(arrQueries, "BEGIN TRANSACTION");
			conn.addQuery(arrQueries,"REPLACE INTO transactions (tx_id, block_height) VALUES (?,?)",[tx_id, height]);
			if (from_wallet_id)
				conn.addQuery(arrQueries,"REPLACE INTO transaction_from (id, wallet_id,amount) VALUES (last_insert_rowid(),?,?)",[from_wallet_id, value_in]);
			for (var i=0; i<outputs.length; i++){
				conn.addQuery(arrQueries,"REPLACE INTO transaction_to(id, wallet_id, address, amount) \n\
				VALUES (last_insert_rowid(), (SELECT wallet_id FROM btc_addresses WHERE address=?),?,?)",[outputs[i].address, outputs[i].address, outputs[i].value]);
			}
			conn.addQuery(arrQueries, "COMMIT");
			async.series(arrQueries, function() {
				conn.release();
				resolve();
			});
		});
	});
}

function saveInputAddresses(input_addresses,wallet_id){
	return new Promise(function(resolve){
		var insertString ="('" + wallet_id +"','";
		insertString += input_addresses.join("'),('" + wallet_id + "','");
		insertString +="')";

		db.takeConnectionFromPool(function(conn) {
			var arrQueries = [];
			conn.addQuery(arrQueries, "BEGIN TRANSACTION");
			conn.addQuery(arrQueries,"INSERT OR IGNORE INTO btc_addresses (wallet_id, address) VALUES " + insertString);
			conn.addQuery(arrQueries, "COMMIT");
			async.series(arrQueries, function() {
				conn.release();
				resolve();
			});
		});
	});
}

function mergeWalletIds(input_addresses,block_height, block_time, tx_index){
	return new Promise(function(resolve){
		if (input_addresses.length > 1){
			db.takeConnectionFromPool(async function(conn) {
				var rows =  await conn.query("SELECT COUNT(ROWID) as count, wallet_id FROM btc_addresses  INDEXED BY byWalletId WHERE wallet_id \n\
				IN(SELECT DISTINCT(wallet_id) FROM btc_addresses \n\
					WHERE address IN(?))\n\
				GROUP BY wallet_id ORDER BY count DESC,wallet_id ASC", [input_addresses]); 
				var arrQueries = [];
				conn.addQuery(arrQueries, "BEGIN");
				var wallet_ids_to_update = rows.map(function(row){
					return row.wallet_id}).filter(function(id) { return id !== rows[0].wallet_id });
				if(wallet_ids_to_update.length > 0){
					conn.addQuery(arrQueries, "UPDATE btc_addresses SET wallet_id=? WHERE wallet_id IN(?)", [rows[0].wallet_id, wallet_ids_to_update]);
					conn.addQuery(arrQueries, "UPDATE transaction_from SET wallet_id=? WHERE wallet_id IN(?)", [rows[0].wallet_id, wallet_ids_to_update]);
					conn.addQuery(arrQueries, "UPDATE transaction_to SET wallet_id=? WHERE wallet_id IN(?)", [rows[0].wallet_id, wallet_ids_to_update]);
				}
				conn.addQuery(arrQueries, "UPDATE transaction_to INDEXED BY toByAddress SET wallet_id=? WHERE wallet_id IS NULL AND address IN(?)", [rows[0].wallet_id, input_addresses]);

				rows.splice(1).forEach(function(row){
					conn.addQuery(arrQueries, "REPLACE INTO redirections (from_id, to_id) VALUES (?,?)",[row.wallet_id, rows[0].wallet_id]);
				});
				conn.addQuery(arrQueries, "REPLACE INTO blocks_processed (block_height,tx_index,block_time) VALUES (?,?,?)",[block_height, tx_index, block_time]);

				conn.addQuery(arrQueries, "COMMIT");
				async.series(arrQueries, function() {
					conn.release();
					resolve();
				});
			});
		} else {
			resolve();
		}
	});
}

function downloadNextWhileProcessing(blockheight, start_tx_index,  objBlock){
	return new Promise((resolve)=>{
		if (!objBlock){
			downloadBlockAndParse(blockheight, async function(error, objBlock){
				resolve(await downloadNextWhileProcessing(blockheight, start_tx_index, objBlock));
			});
		} else {
			async.parallel([
				function(callback) {
					downloadBlockAndParse(blockheight + 1, callback);
				},
				function(callback) {
					processBlock(objBlock, start_tx_index, callback);
				}
			],
			function(error, arrResults) {
				resolve(arrResults[0]);
			});

		}
	})
}

function downloadBlockAndParse(blockheight, handle){
	request({
		url: "https://blockchain.info/block-height/"+blockheight+"?format=json"
	}, function(error, response, body) {
		try {
			var objBlock = JSON.parse(body).blocks[0];
		} catch (e) {
			console.error(e);
			return downloadBlockAndParse(blockheight, handle)
		}
		console.error("block " + blockheight + " downloaded");
		handle(null, objBlock);
	});

}