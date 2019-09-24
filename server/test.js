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

	await db.query("CREATE TABLE IF NOT EXISTS blocks_processed (\n\
		block_height INTEGER  PRIMARY KEY, \n\
		tx_index INTEGER)")

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
			tx.inputs.forEach(function(input){
				if (!input.prev_out || !input.prev_out.addr) // coinbase
					return;
				input_addresses.push(input.prev_out.addr);
			})
			input_addresses = [...new Set(input_addresses)];
			input_addresses.sort();
			var wallet_ids = [];
			input_addresses.forEach(function(address){
				wallet_ids.push(crypto.createHash("ripemd160").update(address, "utf8").digest().toString('hex'));
			})
			wallet_ids.sort();
			//it looks eachOfSeries doesn't work serially anymore with async function, so we wrap in anonymous function
			(async function(){
				await saveAddresses(input_addresses, wallet_ids[0]);
				await mergeWalletIds(input_addresses, objBlock.height, tx_index);// we merge these input addresses in the wallet id that has already the most addresses and set up redirections
				callback()	
			})();
		}, function(){
			console.error("block " + objBlock.height + " processed");
			return handle();
		});
}

function saveAddresses(input_addresses,wallet_id){
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

function mergeWalletIds(input_addresses,block_height, tx_index){
	return new Promise(function(resolve){
		if (input_addresses.length > 1){
			db.takeConnectionFromPool(async function(conn) {
				var rows =  await conn.query("SELECT COUNT(address) as count, wallet_id FROM btc_addresses WHERE wallet_id IN(SELECT DISTINCT(wallet_id) FROM btc_addresses \n\
					WHERE address IN(?))\n\
				GROUP BY wallet_id ORDER BY count DESC,wallet_id ASC", [input_addresses]); 
				var arrQueries = [];
				conn.addQuery(arrQueries, "BEGIN");
				var wallet_ids_to_update = rows.map(function(row){
					return row.wallet_id}).filter(function(id) { return id !== rows[0].wallet_id });
				if(wallet_ids_to_update.length > 0)
					conn.addQuery(arrQueries, "UPDATE btc_addresses SET wallet_id=? WHERE wallet_id IN(?)", [rows[0].wallet_id, wallet_ids_to_update]);

				rows.splice(1).forEach(function(row){
					conn.addQuery(arrQueries, "REPLACE INTO redirections (from_id, to_id) VALUES (?,?)",[row.wallet_id, rows[0].wallet_id]);
				});
				conn.addQuery(arrQueries, "REPLACE INTO blocks_processed (block_height,tx_index) VALUES (?,?)",[block_height, tx_index]);

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