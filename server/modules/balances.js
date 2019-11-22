/*jslint node: true */
"use strict";
const db = require('ocore/db.js');
const conf = require('ocore/conf.js');
const request = require('request');
const async = require('async');
const mutex = require('ocore/mutex.js');
const zlib = require('zlib');
const stats = require("./stats.js");


const block_server_url = conf.block_server;

if (!block_server_url)
	throw Error("block_server missing in conf");

var lastBlockHeightProcessed;

(async function(){

	await db.query("CREATE TABLE IF NOT EXISTS balance_processed_blocks (\n\
		block_height INTEGER  PRIMARY KEY, \n\
		tx_index INTEGER NOT NULL )")
	await db.query("INSERT OR IGNORE INTO balance_processed_blocks (block_height,tx_index) VALUES (0,-1)");


 if (process.env.faster){
		await db.query("PRAGMA synchronous = 0 ");
	}
})();

getLastHeightThenProcess();
setInterval(getLastHeightThenProcess, 60000);

function getLastHeightThenProcess(){
	getLastBlockHeight(function(error, last_block_height){
		if (error)
			return error;
		if (process.env.testnet && !process.env.full_indexation)
			processToBlockHeight(184452);
		else
			processToBlockHeight(604459);
	});
}

function processToBlockHeight(to_block_height){
	mutex.lockOrSkip(["process"], async function(unlock){
		const rows = await db.query("SELECT MAX(block_height) as height,tx_index FROM balance_processed_blocks");
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

		async.eachOfSeries(objBlock.tx,  function(tx, tx_index, callback){ //each tx from block is treated by this function
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
			tx.vout.forEach(function(output){
					var output_value_out = Math.round(output.value*100000000);
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

			//it looks eachOfSeries doesn't work serially anymore with async function, so we wrap in anonymous function
			(async function(){
					var objInputs = null;
					if (inputs.length > 0)
						objInputs = await getInputs(inputs);
					await	processBalances(objInputs,outputs,objBlock.height, tx_index);
					callback();
				})();

		}, function(){
			var processingTime = Date.now()-block_start_time;
			lastBlockHeightProcessed = objBlock.height;
			console.log("block " + objBlock.height + " processed in " + processingTime +'ms, ' + (processingTime/objBlock.tx.length).toFixed(4) + " ms per transaction");
			return handle();
		});
}


function getInputs(inputs){
	return new Promise(function(resolve){
		db.executeInTransaction(async function doWork(conn, cb){
			//sqlite returns an error if expression is too deep, so we divide in chunks of 500 inputs
			function appendRows(inputs){
				return new Promise(async function(resolve_2){
					const inputsSlice = inputs.slice(0, 500);
					const sqlFilter =	inputsSlice.map(function(input){ return " (transactions.tx_id='"+input.tx_id+"' AND transactions_to.n="+input.vout+")";}).join(' OR ');
					var rows = await conn.query("SELECT transactions_to.address_id,amount,tx_id FROM transactions INNER JOIN transactions_to USING(id) WHERE "+ sqlFilter);
					if (inputs.length > 500)
						return resolve_2(rows.concat(await appendRows(inputs.slice(500))));
					else
						return resolve_2(rows);
				});
			}
			var rows = await appendRows(inputs);
			if (rows.length != inputs.length){
				throw Error("input missing " + rows.length + " " +inputs.length);
			}
			cb();
			resolve({rows: rows });
		});
	});
}


function processBalances(objInputs,outputs,block_height, tx_index, block_time){
	return new Promise(async function(resolve){
		db.takeConnectionFromPool(function(conn) {
			var arrQueries = [];
			conn.addQuery(arrQueries, "BEGIN TRANSACTION");
			for (var i=0; i<outputs.length; i++){
				conn.addQuery(arrQueries,"UPDATE btc_addresses SET balance=balance+? WHERE address=?",[outputs[i].value, outputs[i].address]);
			}
			if (objInputs){
				for (var i = 0; i<objInputs.rows.length; i++){
					conn.addQuery(arrQueries,"UPDATE btc_addresses SET balance=balance-? WHERE id=?",[objInputs.rows[i].amount, objInputs.rows[i].address_id]);
				}
			}
			conn.addQuery(arrQueries, "REPLACE INTO balance_processed_blocks (block_height,tx_index) VALUES (?,?)",[block_height, tx_index, block_time]);

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
						stats.clearCaches();
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
		url: block_server_url + blockheight + ".gz",
		encoding: null
	}, function(error, response, body) {
		if (error || response.statusCode !== 200){
			return setTimeout(function(){
				downloadBlockAndParse(blockheight, handle);
			}, 2000);
		}
		zlib.unzip(body, function(err, unZippedData) {
			if (err) {
				return downloadBlockAndParse(blockheight, handle);
			} else {
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
		return resolve((await db.query("SELECT MAX(block_height) as height FROM balance_processed_blocks"))[0].height);
	});
}



exports.getLastProcessedHeight = getLastProcessedHeight;