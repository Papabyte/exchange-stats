/*jslint node: true */
"use strict";
const db = require('ocore/db.js');
const request = require('request');
const async = require('async');
const mutex = require('ocore/mutex.js');
const zlib = require('zlib');


var lastBlockHeightProcessed;

(async function(){
	await db.query("CREATE TABLE IF NOT EXISTS fix_processed_blocks (\n\
		block_height INTEGER  PRIMARY KEY, \n\
		block_time INTEGER,\n\
		tx_index INTEGER NOT NULL )")
	await db.query("INSERT OR IGNORE INTO fix_processed_blocks (block_height,tx_index) VALUES (0,-1)");
 if (process.env.faster){
		await db.query("PRAGMA journal_mode=MEMORY");
		await db.query("PRAGMA synchronous = 0 ");
	//	await db.query("PRAGMA LOCKING_MODE = EXCLUSIVE");
	}
})();

getLastHeightThenProcess();
setInterval(getLastHeightThenProcess, 60000);

function getLastHeightThenProcess(){
	getLastBlockHeight(function(error, last_block_height){
		if (error)
			return error;
		if (process.env.testnet)
			processToBlockHeight(181496);
		else
			processToBlockHeight(553689);
	});
}

function processToBlockHeight(to_block_height){
	mutex.lockOrSkip(["process"], async function(unlock){
		const rows = await db.query("SELECT MAX(block_height) as height,tx_index FROM fix_processed_blocks");
		console.log("catchup from block " + rows[0].height + " tx index " + (rows[0].tx_index+1));
		if (rows[0].height >= to_block_height)
			return unlock();

		var nextBlock = await downloadNextWhileProcessing(rows[0].height, rows[0].tx_index+1);
		for (var i = rows[0].height+1; i<=to_block_height; i++){
			if (i % 1000 == 0){
				if (process.env.vacuum){
					await db.query("VACUUM");
					console.log("db vaccumed");
				}
			}
			nextBlock = await	downloadNextWhileProcessing(i, 0, nextBlock);
		}
		unlock();
	});
}

async function processBlock(objBlock, start_tx_index, handle){
		var block_start_time = Date.now();
		console.log("block " + objBlock.height + " txs in this block: " + objBlock.tx.length + " start_tx_index " + start_tx_index);
		var fixes = [];
		async.eachOfSeries(objBlock.tx,  function(tx, tx_index, callback){ //each tx from block is treated by this function
			var inputs = [];
			tx.vin.forEach(function(input){
				if (input.coinbase) // coinbase
					return;
				else if (input.txid){
					inputs.push({tx_id: input.txid, vout: input.vout});
				} else
					throw Error("coin base nor tx " + tx.txid);
			})

			if (inputs.length == 0){ // coinbase
				return callback();
			}

			//it looks eachOfSeries doesn't work serially anymore with async function, so we wrap in anonymous function
			(async function(){
				const address_id = await getOneAddressId(inputs);
				fixes.push({address_id: address_id, tx_id: tx.txid});
		//		await fix(address_id, tx.txid, objBlock.height , tx_index);
				callback();
			})();
		}, async function(){
			var processingTime = Date.now()-block_start_time;
			await fix(fixes);
			db.takeConnectionFromPool(function(conn) {
				var arrQueries = [];
				conn.addQuery(arrQueries, "BEGIN TRANSACTION");
				conn.addQuery(arrQueries, "REPLACE INTO fix_processed_blocks (block_height,tx_index) VALUES (?,0)",[objBlock.height]);
				conn.addQuery(arrQueries, "COMMIT");
				async.series(arrQueries, function() {
					conn.release();

					lastBlockHeightProcessed = objBlock.height;
					console.log("block " + objBlock.height + " processed in " + processingTime +'ms, ' + (processingTime/objBlock.tx.length).toFixed(4) + " ms per transaction");
					return handle();
				});
			});

		});
}


function getOneAddressId(inputs){
	return new Promise(async function(resolve){
		var rows = await db.query("SELECT transactions_to.address_id FROM transactions INNER JOIN transactions_to USING(id)\n\
		 WHERE transactions.tx_id=? AND transactions_to.n=?",[inputs[0].tx_id, inputs[0].vout]);
		if(!rows[0])
			throw Error(inputs[0].tx_id + " not found");
			resolve(rows[0].address_id);
	});
}


function fix(fixes){
	return new Promise(async function(resolve){
		db.takeConnectionFromPool(function(conn) {
			var arrQueries = [];
			conn.addQuery(arrQueries, "BEGIN TRANSACTION");
			fixes.forEach(function(row){
				conn.addQuery(arrQueries,"UPDATE transactions_from SET wallet_id=(SELECT wallet_id FROM btc_addresses WHERE id=?) WHERE id=(SELECT id from transactions WHERE tx_id=?)",[row.address_id, row.tx_id]);
			});
			conn.addQuery(arrQueries, "COMMIT");
			async.series(arrQueries, function() {
				conn.release();
				resolve();
			});
		});
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
					processBlock(objBlock, start_tx_index, function(){
						callback();
					});
				}
			],
			function(error, arrResults) {
				resolve(arrResults[0]);
			});
		}
	})
}

function downloadBlockAndParse(blockheight, handle){
	console.log("will request block " + blockheight);
	request({
		url: "http://5.39.78.212/"+blockheight+".gz",
		encoding: null
	}, function(error, response, body) {
		if (error || response.statusCode !== 200){
			return downloadBlockAndParse(blockheight, handle);
		}
		zlib.unzip(body, function(err, unZippedData) {
			if (err) {
				return downloadBlockAndParse(blockheight, handle);
			} else{
				var objBlock = JSON.parse(unZippedData);
				console.log("block " + blockheight + " downloaded");
				handle(null, objBlock);
			}
		});
	})
}


function getLastBlockHeight( handle){
	request({
		url: "https://blockchain.info/latestblock"
	}, function(error, response, body) {

		if (error || response.statusCode !== 200) 
			return handle(error +" " + response)
		try {
			var objLastBlock = JSON.parse(body);
		} catch (e) {
			console.log(e);
			return handle(e);
		}
;

		handle(null, objLastBlock.height);
	});
}

function getLastProcessedHeight(){
	return new Promise(async function(resolve){
		if (lastBlockHeightProcessed)
			return resolve(lastBlockHeightProcessed);
		else 
		return resolve((await db.query("SELECT MAX(block_height) as height FROM fix_processed_blocks"))[0].height);
	});
}



exports.getLastProcessedHeight = getLastProcessedHeight;