
const Client = require('bitcoin-core');
const fs = require('fs');
const zlib = require('zlib');

const CONFIRMATIONS = 3;
const USERNAME = process.env.username;
const PASSWORD = process.env.password;
const BLOCK_FOLDER = "blocks/";

var isProcessing = false;
var current_block_index = null;

start();

async function start(){
	current_block_index = await getHighestSavedBlockNumber();
	console.log("current block index " + current_block_index);
	setInterval(function(){
		if (isProcessing)
			return console.log("ongoing processing");
		isProcessing = true;
		getBlocksAboveIndex().then(function() {
			isProcessing = false;
		});
	}, 10000);
}


function getBlocksAboveIndex(){
	return new Promise(function(resolve){
		client.getBlockCount().then(function(count){
			if (count > (current_block_index + CONFIRMATIONS)){
				current_block_index++;
				saveBlockOndisk(current_block_index).then(function(){
					getBlocksAboveIndex().then(resolve);
				});
			} else {
				resolve();
			}
		}).catch(resolve);
	});
}


function saveBlockOndisk(height){

	return new Promise(async function(resolve){
		client.getBlockHash(height).then(function(block_hash){
			client.getBlockByHash(block_hash, { extension: 'json' }).then(async (block) => {
				console.log("read block " + block.height);
				const txs = block.tx;

				for (var i=0; i<	txs.length; i++){
					var tx = txs[i];
					delete tx.hash;
					delete tx.version;
					delete tx.size;
					delete tx.vsize;
					delete tx.weight;
					delete tx.locktime;
					delete tx.hex;

					var vin = tx.vin;
					for (var j=0; j<	vin.length; j++){
						delete vin[j].scriptSig;
						delete vin[j].txinwitness;
						delete vin[j].sequence;
					}
					
					var vout = tx.vout;

					for (var j=0; j<	vout.length; j++){
						delete vout[j].scriptPubKey.asm;
						delete vout[j].scriptPubKey.hex;
						delete vout[j].hex;
					}
				}
				var bufferObject = new Buffer.from(JSON.stringify(block));
				zlib.gzip(bufferObject, function(err, zippedData) {
					fs.writeFile(BLOCK_FOLDER + block.height + '.gz',zippedData, ()=>{
						console.log("wrote block " + block.height);
						resolve();
					});
				})

			}).catch(function(error){
				console.log(error);
				saveBlockOndisk(height).then(resolve);
			});
		}).catch(function(error) { 
			console.log(error);
			saveBlockOndisk(height).then(resolve);
		});
	});
}


async function getHighestSavedBlockNumber(){
	var files = fs.readdirSync(BLOCK_FOLDER);
	var block_numbers = files.map(function(file){
		return Number(file.replace('.gz',''))
	}).sort(function(a,b) {return b-a});
	return block_numbers[0];
}

//connect to local bitcoin full node
const client = new Client({ 
	username: USERNAME,
  password: PASSWORD,
  port: 8000 
});



