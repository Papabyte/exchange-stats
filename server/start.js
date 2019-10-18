const express = require('express')
//const ocore = require('./node_modules/ocore/');
const validationUtils = require("ocore/validation_utils.js");
const conf = require('ocore/conf.js');

const validate = require('bitcoin-address-validation');

require('./modules/sqlite_tables.js').create().then(function(){
	
	const aa_handler = require("./modules/aa_handler.js");
	const indexer = require('./modules/indexer.js');
	const explorer = require('./modules/explorer.js');
	const exchanges = require('./modules/exchanges.js');

	const app = express()

	app.get('/api/wallet/:id/:page', function(request, response){
		const id = Number(request.params.id);
		const page = request.params.page ? Number(request.params.page) : 0;

		if (!validationUtils.isNonnegativeInteger(id))
			return response.status(400).send('Wrong wallet id');
		if (!validationUtils.isNonnegativeInteger(page))
			return response.status(400).send('Wrong page');

		explorer.redirections([id], function(redirected_ids){
			explorer.getTransactionsFromWallets(redirected_ids, page, function(assocTxsFromWallet){
				return response.send({txs: assocTxsFromWallet, redirected_id: redirected_ids[0], exchange: aa_handler.getCurrentExchangeByWalletId(id)});
			});
		})
	});

	app.get('/api/address/:address', function(request, response){
		const address = request.params.address;
		if (!validate(address))
			return response.status(400).send('Wrong BTC address');
		explorer.getWalletIdFromAddress(address, function(wallet_id){
			explorer.getTransactionsFromWallets([wallet_id], 0, function(assocTxsFromWallet){
				return response.send({txs: assocTxsFromWallet, redirected_id: wallet_id});
			});
		})
	});


	app.get('/api/exchanges', function(request, response){
			return response.send(	exchanges.getExchangesList());
	});

	app.get('/api/exchange/:exchange/:page', function(request, response){
		const exchange = request.params.exchange;
		const page = request.params.page ? Number(request.params.page) : 0;
		if (!validationUtils.isNonnegativeInteger(page))
			return response.status(400).send('Wrong page');
		if(!validationUtils.isNonemptyString(exchange))
			return response.status(400).send('Wrong exchange id');
		const wallet_ids = exchanges.getExchangeWalletIds(exchange);
		explorer.redirections(wallet_ids, function(redirected_ids){
			explorer.getTransactionsFromWallets(redirected_ids, page, function(assocTxsFromWallet){
				return response.send({txs: assocTxsFromWallet, wallet_ids: wallet_ids, redirected_ids: redirected_ids, name: exchanges.getExchangeName(exchange)});
			});
		})
	});

	app.get('/api/exchange-wallets/:exchange/', function(request, response){
		const exchange = request.params.exchange;
		if(!validationUtils.isNonemptyString(exchange))
			return response.status(400).send('Wrong exchange id');
		const wallet_ids = exchanges.getExchangeWalletIds(exchange);
			return response.send(wallet_ids);
	})


	app.get('/api/txid/:tx_id', function(request, response){
		const tx_id = request.params.tx_id;
		console.error(tx_id);
		if (!validationUtils.isValidHexadecimal(tx_id, 64))
			return response.status(400).send('Wrong tx id');
		explorer.getTransactionFromTxId(tx_id, function(assocTxs){
			return response.send({txs: assocTxs});
		});
	});
	

	app.get('/api/ranking', function(request, response){
		exchanges.getLastRanking(function(arrLastRanking){
		return response.send(arrLastRanking);
		});
	});

	app.get('/api/pools', function(request, response){
		return response.send(aa_handler.getCurrentPools());
	});

	app.get('/api/pool/:exchange', function(request, response){
		const exchange = request.params.exchange;
		if(!validationUtils.isNonemptyString(exchange))
			return response.status(400).send('Wrong exchange id');
		return response.send(aa_handler.getBestPoolForExchange(exchange));
	});
	


	app.get('/api/operations/:exchange', function(request, response){
		const exchange = request.params.exchange;
		if(!validationUtils.isNonemptyString(exchange))
			return response.status(400).send('Wrong exchange id');
		return response.send(aa_handler.getCurrentOperationsForExchange(exchange));
	});

	app.get('/api/operations', function(request, response){
		console.log('/api/operations');
		return response.send(aa_handler.getCurrentOperations());
	});

	app.get('/api/aa_transactions', function(request, response){
		aa_handler.getLastTransactionsToAA(function(transactions){
			return response.send(transactions);
		});
	});

	app.get('/api/redirection/:id', function(request, response){
		const id = Number(request.params.id);
		const address = request.params.id;
		if (validationUtils.isNonnegativeInteger(id)){
			return explorer.redirections([id], function(ids){
				return response.send({redirected_id: ids[0]});
			});
		} else if (validate(address)){
			console.error("validate " + address);
			explorer.getWalletIdFromAddress(address, function(wallet_id){
				console.error("getWalletIdFromAddress " + wallet_id);
				return response.send({redirected_id: wallet_id});
			});
		} else 			
				return response.status(400).send('Not wallet id nor BTC address');
	});

	app.listen(conf.api_port);

});