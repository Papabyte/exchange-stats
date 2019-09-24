/*jslint node: true */
"use strict";
var kvstore = require('ocore/kvstore.js');
const request = require('request');
const async = require('async');
const crypto = require('crypto');

(async function(){


	var nextBlock = await downloadNextWhileProcessing(400000, 0);
	for (var i = 400000+1; i<600000; i++){
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


function kvGet(key) {
	return new Promise(function(resolve){
		kvstore.get(key, function (value) {
			resolve(value);
		});

	})

}
function saveAddresses(input_addresses, wallet_id){
	return new Promise(async function(resolve){
		var batch = kvstore.batch();
		
		console.error("batch taken for " +wallet_id);
		var value = await kvGet('wal_cnt_\n' + wallet_id);
		console.error(value);
		if (value === undefined) {
			batch.put('wal_cnt_\n' + wallet_id, 1)
		} else {
			batch.put('wal_cnt_\n' + wallet_id, Number(value) + input_addresses.length)
		}


		var value = await kvGet('wal_\n' + wallet_id);
		if (value === undefined) {
			batch.put('wal_\n' + wallet_id, input_addresses.join(' '))
		} else {
			batch.put('wal_\n' + wallet_id, value + ' ' + input_addresses.join(' '));
		}
		console.error("2");

		for (var i = 0; i< input_addresses.length; i++){
			var value = await kvGet('add\n' + input_addresses[i]) 
				if (value === undefined) {
					batch.put('add\n' + input_addresses[i], wallet_id);
				}
		}
		console.error("3");

		batch.write(function(err){
			if (err)
				throw Error("batch write failed: "+err);
			console.error("batch written");
			resolve();
		});
	});
}

function mergeWalletIds(input_addresses,block_height, tx_index){
	return new Promise(function(resolve){
		if (input_addresses.length > 1){

			var wallets = [];
			var string_addresses = "";
			async.eachSeries(input_addresses,  function(input_address, callback){
				
				kvstore.get('add\n' + input_address, async function (wallet_id) {
					if (wallet_id === undefined) 
						throw Error("input_address read failed");
						var count = await kvGet('wal_cnt_\n' + wallet_id);
						string_addresses += " " + await kvGet('wal_\n' + wallet_id);

							wallets.push({ 
								wallet_id: wallet_id,
								count: count
							});
							callback();
				})
			}, function(){
				wallets.sort(function(a,b){
					if (Number(a.count) == Number(b.count)){
						if (a.wallet_id > b.wallet_id)
							return 1;
						else
							return -1;

					} else{
					if (Number(a.count) < Number(b.count))
						return 1;
					else
						return -1;
					}
				});
				console.error(wallets);
				var batch = kvstore.batch();
				var wallet_id = wallets[0].wallet_id;
				var count = Number(wallets[0].count);
					var addresses = string_addresses.split(' ');
					addresses.forEach(function(address){
						batch.put('add\n' + address, wallet_id);
					});
					wallets.splice(1).forEach(function(wallet){
						batch.del('wal_\n' + wallet.wallet_id);
						batch.put('redi_\n' + wallet.wallet_id, wallet_id);
					});
					batch.put('wal_\n' + wallet_id, addresses.concat(input_addresses).join(' '));
					batch.put('wal_cnt_\n' + wallet_id, addresses.concat(input_addresses).length);
					batch.write(function(err){
						if (err)
							throw Error("batch write failed: "+err);
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