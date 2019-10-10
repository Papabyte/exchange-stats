const Client = require('bitcoin-core');
const fs = require('fs');
const zlib = require('zlib');

//connect to local bitcoin full node
const client = new Client({ 
	username: 'extern', 
  password: 'p9gonL7ao9H7Vnb1IV9n', 
  port: 8000 
});

mainLoop()

async function mainLoop(){
	var nextBlock = await saveBlockOndiskAndGetNextHash("000000000000000002537dcadc89fc4be3118c86162df7606700335bf03f6e6b");
	while(1){
		nextBlock = await saveBlockOndiskAndGetNextHash(nextBlock);
	}
}

function saveBlockOndiskAndGetNextHash(block_hash){

	return new Promise(async function(resolve){
		try {
			client.getBlockByHash(block_hash, { extension: 'json' }).then(async (block) => {
				console.log("block " + block.height);
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
					fs.writeFile("blocks/"+block.height+'.gz',zippedData, ()=>{});
				})

				resolve(block.nextblockhash);
			})
		} catch(error) { 
			console.log(error);
			saveBlockOndiskAndGetNextHash-(block_hash).then(resolve);
		}
	});
}