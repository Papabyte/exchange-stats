const async = require('async');
const request = require('request');

(async function() {
	for (var i = 0; i < 300000; i+=5) {
		await Promise.all([check(i),check(i+1),check(i+2),check(i+3),check(i+4)])

		console.error("blocks " + i + " match");
	}
})();


function check(block_height) {
	return new Promise(function(resolve, reject) {

			async.parallel([
					function(cb) {
						getBlockHash(block_height, function(block_hash) {

							return cb(null, block_hash);

						});
					},
					function(cb) {
						downloadBlockAndParse(block_height, function(error, objBlock) {

							return cb(null, objBlock.hash);

						});
					}
				], function(error, results) {
					if (results[0] === results[1])
						resolve();
					else
						throw Error("mismatch at " + block_height);
				});
			});
	}

function getBlockHash(block_height, handle){

	request({
		url: "https://blockstream.info/api/block-height/" + block_height
	}, function(error, response, body) {
		console.log(body);

		if (body.length != 64 ){
			console.error("wrong hash for " + block_height);
			return getBlockHash(block_height, handle)
		}

		console.error("block " + block_height + "has hash " + body);
		handle(body);
	});

}


function downloadBlockAndParse(blockheight, handle){
	console.error("will request block " + blockheight);
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
