const express = require('express')
const rateLimit = require("express-rate-limit");
const expressLogging = require('express-logging');
const logger = require('logops');
const validationUtils = require("ocore/validation_utils.js");
const conf = require('ocore/conf.js');
const validate = require('bitcoin-address-validation');

require('./modules/sqlite_tables.js').create().then(function(){
	
	const aa_handler = require("./modules/aa_handler.js");
	const indexer = require('./modules/indexer.js');
	const explorer = require('./modules/explorer.js');
	const exchanges = require('./modules/exchanges.js');
	const social_networks = require('./modules/social_networks.js');
	const app = express()

	const limiter = rateLimit({
		windowMs: 5 * 60 * 1000, // 5 minutes
		max: 500 // limit each IP to 300 requests per windowMs
	});

	app.set('trust proxy', 1);

	app.use(limiter);
	app.use(expressLogging(logger));

	
	app.get('/api/wallet/:id/:page', async function(request, response){
		const id = Number(request.params.id);
		const page = request.params.page ? Number(request.params.page) : 0;

		if (!validationUtils.isNonnegativeInteger(id))
			return response.status(400).send('Wrong wallet id');
		if (!validationUtils.isNonnegativeInteger(page))
			return response.status(400).send('Wrong page');
		const redirected_ids = await explorer.getUniqueRedirections([id]);
		const redirections_from = await explorer.getRedirectionsFrom([id]);
		explorer.getTransactionsFromWallets(redirected_ids, page, function(assocTxsFromWallet){
				return response.send({
					txs: assocTxsFromWallet, 
					redirections_from: redirections_from, 
					exchange: aa_handler.getExchangeByWalletId(id),
					isOnOperation: aa_handler.getIsWalletOnOperation(id),
				});
		})
	});

	app.get('/api/address/:address', function(request, response){
		const address = request.params.address;
		if (!validate(address))
			return response.status(400).send('Wrong BTC address');
		explorer.getWalletIdFromAddress(address, function(wallet_id){
			return response.send({redirected_id: wallet_id});
		})
	});


	app.get('/api/exchanges', function(request, response){
			return response.send(	exchanges.getExchangesList());
	});

	app.get('/api/exchange/:exchange/:page', async function(request, response){
		const exchange = request.params.exchange;
		const page = request.params.page ? Number(request.params.page) : 0;
		if (!validationUtils.isNonnegativeInteger(page))
			return response.status(400).send('Wrong page');
		if(!validationUtils.isNonemptyString(exchange))
			return response.status(400).send('Wrong exchange id');
		const wallet_ids = exchanges.getExchangeWalletIds(exchange);
		const redirected_ids = await explorer.getUniqueRedirections(wallet_ids);
		const redirections_from = await explorer.getRedirectionsFrom(wallet_ids);
		explorer.getTransactionsFromWallets(redirected_ids, page, function(assocTxsFromWallet){
			return response.send({
				txs: assocTxsFromWallet, 
				wallet_ids: wallet_ids, 
				redirections_from: redirections_from, 
				name: exchanges.getExchangeName(exchange),
			});
		});
	});

	app.get('/api/exchange-wallets/:exchange/', function(request, response){
		const exchange = request.params.exchange;
		if(!validationUtils.isNonemptyString(exchange))
			return response.status(400).send('Wrong exchange id');
		const wallet_ids = exchanges.getExchangeWalletIds(exchange);
			return response.send({wallet_ids});
	})

	app.get('/api/exchange-wallets-infos/:exchange/', async function(request, response){
		const exchange = request.params.exchange;
		if(!validationUtils.isNonemptyString(exchange))
			return response.status(400).send('Wrong exchange id');
		const wallet_ids = exchanges.getExchangeWalletIds(exchange);
		console.log(wallet_ids)
		const objRedirectionsAndInfos = await explorer.getRedirectionsAndInfos(wallet_ids);
			return response.send(objRedirectionsAndInfos);
	})


	app.get('/api/wallet-addresses/:id/:page', async function(request, response){
		const page = request.params.page ? Number(request.params.page) : 0;
		const id = Number(request.params.id);
		if (!validationUtils.isNonnegativeInteger(id))
			return response.status(400).send('Wrong wallet id');
		if (!validationUtils.isNonnegativeInteger(page))
			return response.status(400).send('Wrong page');
		const redirected_ids = await explorer.getUniqueRedirections([id]);
		explorer.getAddressesFromWallet(redirected_ids[0], page, function(objAddresses){
			return response.send(objAddresses);
		});
	});


	app.get('/api/txid/:tx_id', function(request, response){
		const tx_id = request.params.tx_id;
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

	
	app.get('/api/exchange-history/:exchange', function(request, response){
		const exchange = request.params.exchange;
		if(!validationUtils.isNonemptyString(exchange))
			return response.status(400).send('Wrong exchange id');
			exchanges.getExchangeHistory(exchange, function(history){
				return response.send(history);
			});
	});
	

	app.get('/api/pools', function(request, response){
		return response.send(aa_handler.getAllPools());
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
		return response.send(aa_handler.getAllOperationsForExchange(exchange));
	});

	app.get('/api/operations', function(request, response){
		return response.send(aa_handler.getAllOperations());
	});

	app.get('/api/redirection/:id', async function(request, response){
		const id = Number(request.params.id);
		const address = request.params.id;
		if (validationUtils.isNonnegativeInteger(id)){
			const redirected_ids = await explorer.getUniqueRedirections([id]);
			return response.send({redirected_id: redirected_ids[0]});
		} else if (validate(address)){
			explorer.getWalletIdFromAddress(address, function(wallet_id){
				return response.send({redirected_id: wallet_id});
			});
		} else 			
				return response.status(400).send('Not wallet id nor BTC address');
	});

	app.get('/api/operation-history/:id', function(request, response){
		const id = request.params.id;
		if (!validationUtils.isNonemptyString(id))
			return response.status(400).send('Invalid operation id');
			aa_handler.getOperationHistory(id, function(objHistory){
				return response.send(objHistory);
			});
	});

	app.get('/api/contributors-ranking/', function(request, response){
		aa_handler.getContributorsRanking(function(rankingRows){
			return response.send(rankingRows);
		});
	});

	app.get('/api/donors-ranking/', function(request, response){
		aa_handler.getDonorsRanking(function(rankingRows){
			return response.send(rankingRows);
		});
	});

	app.get('/api/contributors-greeting/', function(request, response){
		aa_handler.getContributorsGreeting(function(arrGreetings){
			return response.send(arrGreetings);
		});
	});

	app.get('/api/aa-parameters/', function(request, response){
		return response.send(aa_handler.getAaParameters());
	});

	app.get('/api/url-proofs/:wallet_id/:exchange_id', function(request, response){
		const exchange_id = request.params.exchange_id;
		const wallet_id = Number(request.params.wallet_id);
		if (!validationUtils.isNonnegativeInteger(wallet_id))
			return response.status(400).send('Wrong wallet id');
		if (!validationUtils.isNonemptyString(exchange_id))
			return response.status(400).send('Wrong exchange id');
		return response.send(aa_handler.getUrlProofsForPair(wallet_id, exchange_id));
	});

	app.get('/api/last-operation-history/:wallet_id/:exchange_id', function(request, response){
		const exchange_id = request.params.exchange_id;
		const wallet_id = Number(request.params.wallet_id);
		if (!validationUtils.isNonnegativeInteger(wallet_id))
			return response.status(400).send('Wrong wallet id');
		if (!validationUtils.isNonemptyString(exchange_id))
			return response.status(400).send('Wrong exchange id');
			aa_handler.getLastOperationHistoryForPair(wallet_id, exchange_id, function(error, objHistory){
				if (error)
					return response.status(400).send(error);
				response.send(objHistory);
			})
	});

	app.get('/api/pending-operations-for-exchange/:exchange_id', function(request, response){
		const exchange_id = request.params.exchange_id;
		if (!validationUtils.isNonemptyString(exchange_id))
			return response.status(400).send('Wrong exchange id');
		return response.send(aa_handler.getPendingOperationsForExchange(exchange_id));
	});
	
	app.get('/api/last-events', function(request, response){
		aa_handler.getLastEvents(function(objLastEvents){
			response.send(objLastEvents);
		})
	});

	app.listen(conf.api_port);

});
