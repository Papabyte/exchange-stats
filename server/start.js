const express = require('express')
//const ocore = require('./node_modules/ocore/');
const validationUtils = require("ocore/validation_utils.js");
const aa_handler = require("./modules/aa_handler.js");
const conf = require('ocore/conf.js');

const validate = require('bitcoin-address-validation');

require('./modules/sqlite_tables.js').create().then(function(){

	console.error("before indexer");

	const indexer = require('./modules/indexer.js');
	const explorer = require('./modules/explorer.js');
	const exchanges = require('./modules/exchanges.js');

	const app = express()

	app.get('/wallet/:id/:page', function(request, response){
		const id = Number(request.params.id);
		const page = request.params.page ? Number(request.params.page) : 0;
		if (!validationUtils.isNonnegativeInteger(id))
			return response.status(400).send('Wrong wallet id');
		if (!validationUtils.isNonnegativeInteger(page))
			return response.status(400).send('Wrong page');

		explorer.getRedirections([id], function(redirected_ids){
			explorer.getTransactionsFromWallets(redirected_ids, page, function(assocTxsFromWallet){
				return response.send({txs: assocTxsFromWallet, redirected_id: redirected_ids[0]});
			});
		})
	});

	app.get('/wallet/:id', function(request, response){
		const id = Number(request.params.id);
		if (!validationUtils.isNonnegativeInteger(id))
			return response.status(400).send('Wrong wallet id');

		explorer.getRedirections([id], function(redirected_ids){
			console.error("redirected_ids");

			console.error(redirected_ids);
			explorer.getTransactionsFromWallets(redirected_ids, 0, function(assocTxsFromWallet){
				return response.send({txs: assocTxsFromWallet, redirected_id: redirected_ids[0]});
			});
		})
	});


	app.get('/address/:address', function(request, response){
		const address = request.params.address;
		if (!validate(address))
			return response.status(400).send('Wrong BTC address');
		explorer.getWalletIdFromAddress(address, function(wallet_id){
			explorer.getTransactionsFromWallets([wallet_id], 0, function(assocTxsFromWallet){
				return response.send({txs: assocTxsFromWallet, redirected_id: wallet_id});
			});
		})
	});


	app.get('/exchanges', function(request, response){
		console.error('exchanges');
			return response.send(	exchanges.getExchangesList());
	});

	app.get('/exchange/:exchange', function(request, response){

		const wallet_ids = exchanges.getExchangeWalletIds(request.params.exchange);
		explorer.getRedirections(wallet_ids, function(redirected_ids){
			explorer.getTransactionsFromWallets(redirected_ids, 0, function(assocTxsFromWallet){
				return response.send({txs: assocTxsFromWallet, wallet_ids: redirected_ids, name: exchanges.getExchangeName(request.params.exchange)});
			});
		})
	});

	app.get('/txid/:tx_id', function(request, response){
		const tx_id = request.params.tx_id;
		console.error(tx_id);
		if (!validationUtils.isValidHexadecimal(tx_id, 64))
			return response.status(400).send('Wrong tx id');
		explorer.getTransactionFromTxId(tx_id, function(assocTxs){
			return response.send({txs: assocTxs});
		});
	});
	

	app.get('/ranking', function(request, response){
		exchanges.getLastRanking(function(arrLastRanking){
		return response.send(arrLastRanking);
		});
	});


	app.listen(conf.api_port);

});





/*
const fs = require('fs');
const assocExchanges = {};
var count = 0;
exchanges.forEach(function(row){

	assocExchanges[row.id] = {};
	assocExchanges[row.id].name = row.name;
	assocExchanges[row.id].url = row.url;
	assocExchanges[row.id].country = row.country;
	count++;
	
});
fs.writeFile( 'echa.json', JSON.stringify(assocExchanges), ()=>{});
console.log(count);
*/