const Client = require('bitcoin-core');
const fs = require('fs');
const zlib = require('zlib');

const client = new Client({ 
	username: 'extern', 
  password: 'p9gonL7ao9H7Vnb1IV9n', 
  port: 8000 
});
mainLoop()

async function mainLoop(){
	var nextBlock = await saveBlocksOndiskAndGetNextHash("000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f");
	while(1){
		nextBlock = await saveBlocksOndiskAndGetNextHash(nextBlock);
	}
}

function saveBlocksOndiskAndGetNextHash(block_hash){

	return new Promise(async function(resolve){
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
		});
	});
}

 
/*vin[{
	"txid": "39282c7f4426b264d6f46a83667977933361c1857194f6be5eab6021ce8bcf3b",
	"vout": 1,
	"scriptSig": {
		"asm": "0014e528517cfabeddfbe2ae218ebe18b9d0d13b7794",
		"hex": "160014e528517cfabeddfbe2ae218ebe18b9d0d13b7794"
	},
	"txinwitness": ["30440220243c14bd2a414a8f61ad661675281e7f269168b2d950a1b70560da501f8a667c02206a81c7577369324dfe5879c5edd0c0c670131a4e8c64dccf00d9c389845fdd2601", "0385511999efba6ddc3ccad7ad86aca5e4008758072ac6db056d12dc0a1c6af21f"],
	"sequence": 4294967295
}, {
	"txid": "b085ea9efdf81760cd15a75a1570550f685a297c1ef5cc7501f98f03e52f5d6d",
	"vout": 0,
	"scriptSig": {
		"asm": "001412b604df68b4d5dd4338a5dedc08b08c51d44bda",
		"hex": "16001412b604df68b4d5dd4338a5dedc08b08c51d44bda"
	},
	"txinwitness": ["304402202d784d27862a0601da074ce68e208cf7b34a204e2544dae22331b95ab4b74f36022069045654441914f3ccf4c6ce9bca91b2593d97bf1b6b20892bb777ac4e67e9cd01", "0374de71722821e4dbda293ff8c1db56c9a184d312f09cba574952a76e0fc816e3"],
	"sequence": 4294967295
}, {
	"txid": "17a9690f71bf446d54bc136a7466749a7269f5790d536f0a60fa90f4aa75dd0c",
	"vout": 3,
	"scriptSig": {
		"asm": "001439817162d7fd9f9b16d1af3afe45f158532c5c9d",
		"hex": "16001439817162d7fd9f9b16d1af3afe45f158532c5c9d"
	},
	"txinwitness": ["3044022075fc20b6cb92c35b61f2aa89605fa16b928baa35afd03b415e0ea21541671eb802205f6ff6e4579397b13952a3cdf9719ad289c4c800401121cc36ce4628c16839a501", "02a512ce3ed7bd3028110ec90214a035ccbdd3060f1c425dcb292fbe048f8826c5"],
	"sequence": 4294967295
}]
vout[{
	"value": 0.0013,
	"n": 0,
	"scriptPubKey": {
		"asm": "OP_DUP OP_HASH160 f7d382f75eec9829a6fcb588d1d1b88dad02dc69 OP_EQUALVERIFY OP_CHECKSIG",
		"hex": "76a914f7d382f75eec9829a6fcb588d1d1b88dad02dc6988ac",
		"reqSigs": 1,
		"type": "pubkeyhash",
		"addresses": ["1PbPHTxfeYJehmkispieKtXuNjV5GA1mwx"]
	}
}, {
	"value": 0.00186353,
	"n": 1,
	"scriptPubKey": {
		"asm": "OP_HASH160 898ffd60ad6091221250047a9f2bd64561902634 OP_EQUAL",
		"hex": "a914898ffd60ad6091221250047a9f2bd6456190263487",
		"reqSigs": 1,
		"type": "scripthash",
		"addresses": ["3EENzQdQS3BvvnkeJjC5uVwUKFuTczpnok"]
	}
}]*/


/*
client.getBlock('0000000000000000000e7294c83f5351e9c781ad3c318a3fb8c765c9b27588be').then(async (block) => {
	
	var txs = 	block.tx;

	for (var i=0; i<txs.length; i++){

			var result = await 	client.getTx(txs[i])
					console.error(result);
	}
	
});*/