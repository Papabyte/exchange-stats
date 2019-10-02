/*jslint node: true */
"use strict";
const db = require('ocore/db.js');
const request = require('request');
const async = require('async');
const mutex = require('ocore/mutex.js');
const zlib = require('zlib');

const confirmationsBeforeIndexing = 3;
var lastBlockHeightProcessed;

(async function(){
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

})();


getLastHeightThenProcess();
setInterval(getLastHeightThenProcess, 60000);

function getLastHeightThenProcess(){
	getLastBlockHeight(function(error, last_block_height){
		if (error)
			return error;
		if (process.env.testnet)
			processToBlockHeight(last_block_height - 450000);
		else
			processToBlockHeight(last_block_height - confirmationsBeforeIndexing);
	});
}

function processToBlockHeight(to_block_height){
	mutex.lockOrSkip(["process"], async function(unlock){
		const rows = await db.query("SELECT MAX(block_height) as height,tx_index FROM processed_blocks");
		console.error("catchup from block " + rows[0].height + " tx index " + (rows[0].tx_index+1));
		if (rows[0].height >= to_block_height)
			return unlock();

		var nextBlock = await downloadNextWhileProcessing(rows[0].height, rows[0].tx_index+1);
		for (var i = rows[0].height+1; i<=to_block_height; i++){
			if (i % 1000 == 0){
				if (process.env.vacuum){
					await db.query("VACUUM");
					console.error("db vaccumed");
				}
			}
			nextBlock = await	downloadNextWhileProcessing(i, 0, nextBlock);
		}
		unlock();
	});
}

async function processBlock(objBlock, start_tx_index, handle){
		var block_start_time = Date.now();
		console.error("block " + objBlock.height + " txs in this block: " + objBlock.tx.length + " start_tx_index " + start_tx_index);

		var firstTxTreated = true;
		async.eachOfSeries(objBlock.tx,  function(tx, tx_index, callback){
			if (tx_index < start_tx_index)
				return callback();
			var inputs = [];
			tx.vin.forEach(function(input){
				if (input.coinbase) // coinbase
					return;
				else if (input.txid){
					inputs.push({tx_id: input.txid, vout: input.vout});
				} else
					throw Error("coin base nor tx " + tx.txid);
			})
			var outputs = [];
			var value_out = 0;
			tx.vout.forEach(function(output){
					var output_value_out = Math.round(output.value*100000000);
					value_out += output_value_out;
					if (output.scriptPubKey && output.scriptPubKey.addresses){
						if (output.scriptPubKey.addresses.length == 1){
							outputs.push({address: output.scriptPubKey.addresses[0], value: output_value_out, n: output.n });
						} else {
							outputs.push({value: output_value_out, n: output.n }); // multisig address, we still keep them to sum value in
						}
					} else {
						outputs.push({value: output_value_out, n: output.n }); // non standard address, we still keep them to sum value in
					}
			});

			if (inputs.length == 0){ // coinbase
				(async function(){
					await saveOnlyTransactionsTo(firstTxTreated, tx.txid, objBlock.height, outputs);
					await db.query("REPLACE INTO processed_blocks (block_height,tx_index,block_time) VALUES (?,?,?)",[objBlock.height, tx_index, objBlock.time]);
					callback();
				})();
				return;
			}

			//it looks eachOfSeries doesn't work serially anymore with async function, so we wrap in anonymous function
			(async function(){
				const objInputs = await getInputAddressesIdAndValueIn(inputs);
				if (value_out > objInputs.value_in)
					throw Error("value_out > objInputs.value_in " + tx.txid + " out:" + value_out+ " in:" + objInputs.value_in);
				await saveInputAddressesAndTransactions(firstTxTreated, objInputs, tx.txid, objBlock.height , outputs, tx_index);
				firstTxTreated = false;
				await mergeWallets(objInputs, objBlock.height,objBlock.time, tx_index);// we merge these input addresses in the wallet id that has already the most addresses and set up redirections
				callback();
			})();
		}, function(){
			var processingTime = Date.now()-block_start_time;
			lastBlockHeightProcessed = objBlock.height;
			console.error("block " + objBlock.height + " processed in " + processingTime +'ms, ' + (processingTime/objBlock.tx.length).toFixed(4) + " ms per transaction");
			return handle();
		});
}


function getInputAddressesIdAndValueIn(inputs){
	return new Promise(async function(resolve){
		//sqlite returns an error if expression is too deep, so we divide in chunks of 500 inputs
		function appendRows(inputs){
			return new Promise(async function(resolve_2){
				const inputsSlice = inputs.slice(0, 500);
				const sqlFilter =	inputsSlice.map(function(input){ return " (transactions.tx_id='"+input.tx_id+"' AND transactions_to.n="+input.vout+")";}).join(' OR ');
				var rows = await db.query("SELECT transactions_to.address_id,amount,tx_id FROM transactions INNER JOIN transactions_to USING(id) WHERE "+ sqlFilter);
				if (inputs.length > 500)
					return resolve_2(rows.concat(await appendRows(inputs.slice(500))));
				else
					return resolve_2(rows);
			});
		}

		var rows = await	appendRows(inputs);
		if (rows.length != inputs.length){
			throw Error("input missing " + rows.length + " " +inputs.length);
		}
		var value_in = 0;
		var input_address_ids = rows.map(function(row){
			value_in+= row.amount;
			return row.address_id
		}).filter(function(row){
			return !!row;
		 });
		input_address_ids = [...new Set(input_address_ids)];
		resolve({input_address_ids:input_address_ids, value_in: value_in});
		});
}

function saveOnlyTransactionsTo(bFirstTreated, tx_id, height, outputs){
	return new Promise(async function(resolve){
		if (bFirstTreated){ // check if tx was already treadted when we resume catchup
			const results = await db.query("SELECT 1 FROM transactions WHERE tx_id=?",[tx_id]);
			if (results[0])
				return resolve();
		}

		db.takeConnectionFromPool(function(conn) {
			var arrQueries = [];
			conn.addQuery(arrQueries, "BEGIN TRANSACTION");
			conn.addQuery(arrQueries,"INSERT INTO transactions (tx_id, block_height) VALUES (?,?)",[tx_id, height]);
			for (var i=0; i<outputs.length; i++){
				if (outputs[i].address)
					conn.addQuery(arrQueries,"INSERT OR IGNORE INTO btc_addresses (address) VALUES (?)",[outputs[i].address]);
				conn.addQuery(arrQueries,"INSERT INTO transactions_to(id, wallet_id, address_id, amount,n) \n\
				VALUES ((SELECT id FROM transactions WHERE tx_id=?), (SELECT wallet_id FROM btc_addresses WHERE address=?),(SELECT id FROM btc_addresses WHERE address=?),?,?)",[tx_id, outputs[i].address, outputs[i].address, outputs[i].value, outputs[i].n]);
			}
			conn.addQuery(arrQueries, "COMMIT");
			async.series(arrQueries, function() {
				conn.release();
				resolve();
			});
		});
	});
}

function saveInputAddressesAndTransactions(bFirstTreated, objInputs, tx_id, height, outputs, tx_index){
	return new Promise(async function(resolve){
		if (bFirstTreated){ // check if tx was already treadted when we resume catchup
			const results = await db.query("SELECT 1 FROM transactions WHERE tx_id=?",[tx_id]);
			if (results[0])
				return resolve();
		}

		db.takeConnectionFromPool(function(conn) {
			var arrQueries = [];
			conn.addQuery(arrQueries, "BEGIN TRANSACTION");
			
			conn.addQuery(arrQueries,"INSERT INTO transactions (tx_id, block_height) VALUES (?,?)",[tx_id, height]);
			for (var i=0; i<outputs.length; i++){
				if (outputs[i].address)
					conn.addQuery(arrQueries,"INSERT OR IGNORE INTO btc_addresses (address) VALUES (?)",[outputs[i].address]);
				conn.addQuery(arrQueries,"INSERT INTO transactions_to(id, wallet_id, address_id, amount,n) \n\
				VALUES ((SELECT MAX(id) FROM transactions), (SELECT wallet_id FROM btc_addresses WHERE address=?),(SELECT id FROM btc_addresses WHERE address=?),?,?)",[outputs[i].address, outputs[i].address, outputs[i].value, outputs[i].n]);
			}

			var InputaddressesSqlString = objInputs.input_address_ids.join(",");
			conn.addQuery(arrQueries,"INSERT INTO btc_wallets (addr_count) VALUES (?-(SELECT COUNT(ROWID) FROM btc_addresses WHERE wallet_id IS NOT NULL AND id IN("+InputaddressesSqlString+")))",[objInputs.input_address_ids.length]);	//increase address count only for addresses that are not already known
			conn.addQuery(arrQueries,"UPDATE btc_addresses SET wallet_id=(SELECT MAX(id) FROM btc_wallets) WHERE wallet_id IS NULL AND id IN("+InputaddressesSqlString+")");

			conn.addQuery(arrQueries,"INSERT INTO transactions_from (id, wallet_id,amount) VALUES \n\
				((SELECT MAX(id) FROM transactions),(SELECT MAX(id) FROM btc_wallets),?)",[objInputs.value_in]);

			conn.addQuery(arrQueries, "COMMIT");
			async.series(arrQueries, function() {
				conn.release();
				resolve();
			});
		});
	});
}

function mergeWallets(objInputs,block_height, block_time, tx_index){
	return new Promise(async function(resolve){
		if (objInputs.input_address_ids.length > 1){
			db.takeConnectionFromPool(async function(conn) {
				var InputaddressesSqlString = objInputs.input_address_ids.join(",");
				var rows =  await conn.query("SELECT addr_count,id FROM btc_wallets WHERE id \n\
				IN(SELECT DISTINCT(wallet_id) FROM btc_addresses \n\
					WHERE btc_addresses.id IN("+InputaddressesSqlString+"))\n\
					ORDER BY addr_count DESC,id ASC"); 
				var arrQueries = [];
				conn.addQuery(arrQueries, "BEGIN");
				var wallet_ids_to_update = rows.splice(1).map(function(row){
					return row.id
				});

				if (wallet_ids_to_update.length > 0){
					var wallet_ids_to_update_string =  wallet_ids_to_update.join("','");

					conn.addQuery(arrQueries, "UPDATE btc_wallets SET addr_count=addr_count+(SELECT SUM(addr_count) FROM btc_wallets WHERE id IN('"+wallet_ids_to_update_string+"')) WHERE id=?",[rows[0].id]);
					conn.addQuery(arrQueries, "UPDATE btc_wallets SET addr_count=0 WHERE id IN('"+wallet_ids_to_update_string+"')");

					conn.addQuery(arrQueries, "UPDATE btc_addresses SET wallet_id=? WHERE wallet_id IN('"+wallet_ids_to_update_string+"')",[rows[0].id]);
					conn.addQuery(arrQueries, "UPDATE transactions_from SET wallet_id=? WHERE wallet_id IN('"+wallet_ids_to_update_string+"')",[rows[0].id]);
					conn.addQuery(arrQueries, "UPDATE transactions_to SET wallet_id=? WHERE wallet_id IN('"+wallet_ids_to_update_string+"')",[rows[0].id]);
				}
				wallet_ids_to_update.forEach(function(row){
					conn.addQuery(arrQueries, "REPLACE INTO redirections (from_id, to_id) VALUES (?,?)",[row, rows[0].id]);
				});
				conn.addQuery(arrQueries, "REPLACE INTO processed_blocks (block_height,tx_index,block_time) VALUES (?,?,?)",[block_height, tx_index, block_time]);
				conn.addQuery(arrQueries, "COMMIT");
				async.series(arrQueries, function() {
					conn.release();
					resolve();
				});
			});
		} else {
			await db.query("REPLACE INTO processed_blocks (block_height,tx_index,block_time) VALUES (?,?,?)",[block_height, tx_index, block_time]);
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
		console.error("will request block " + blockheight);
		request({
			url: "http://5.39.78.212/"+blockheight+".gz",
			encoding: null
		}, function(error, response, body) {
			if (error|| response.statusCode !== 200){
				return downloadBlockAndParse(blockheight, handle);
			}
			zlib.unzip(body, function(err, unZippedData) {
				if (err) {
						throw Error("error in unzip decompress using zlib module", err);
				} else{
						var objBlock = JSON.parse(unZippedData);
						console.error("block " + blockheight + " downloaded");
						handle(null, objBlock);
				}
			});
		})

}


function getLastBlockHeight( handle){
	request({
		url: "https://blockchain.info/latestblock"
	}, function(error, response, body) {
		try {
			var objLastBlock = JSON.parse(body);
		} catch (e) {
			console.error(e);
			return handle(e);
		}
		if (error || response.statusCode !== 200) 
			return handle(error +" " + response);

		handle(null, objLastBlock.height);
	});
}

function getLastProcessedHeight(){
	return new Promise(async function(resolve){
		if (lastBlockHeightProcessed)
			return resolve(lastBlockHeightProcessed);
		else 
		return resolve((await db.query("SELECT MAX(block_height) as height FROM processed_blocks"))[0].height);
	});
}



exports.getLastProcessedHeight = getLastProcessedHeight;