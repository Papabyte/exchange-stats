const express = require('express')
//const ocore = require('./node_modules/ocore/');
const validationUtils = require("ocore/validation_utils.js");

const conf = require('ocore/conf.js');
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
			explorer.getTransactionsFromWallets(redirected_ids, 0, function(assocTxsFromWallet){
				return response.send({txs: assocTxsFromWallet, redirected_id: redirected_ids[0]});
			});
		})
	});


	app.get('/exchanges/', function(request, response){
		exchanges.getExchangesList(function(arrExchangesList){
			console.error('exchanges');
			console.error(arrExchangesList);

			return response.send(arrExchangesList);
			})
	});

	app.get('/exchange/:exchange', function(request, response){
		const wallet_ids = exchanges.getExchangeWalletIds(exchange)
		explorer.getRedirections([wallet_ids], function(redirected_ids){
			explorer.getTransactionsFromWallets(redirected_ids, 0, function(assocTxsFromWallet){
				return response.send({txs: assocTxsFromWallet, wallet_ids: redirected_ids});
			});
		})
	});


	app.get('/ranking/', function(request, response){
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