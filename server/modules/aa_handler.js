const conf = require('ocore/conf.js');
const lightWallet = require('ocore/light_wallet.js');
const myWitnesses = require('ocore/my_witnesses.js');
const async = require('async');
const mutex = require('ocore/mutex.js');
const network = require('ocore/network.js');
const wallet_general = require('ocore/wallet_general.js');
const aa_composer = require('ocore/aa_composer.js');
const storage = require('ocore/storage.js');
const db = require('ocore/db.js');
const social_networks = require('./social_networks.js');
const eventBus = require('ocore/event_bus.js');

const exchanges = require('./exchanges.js')

var assocAllPoolsById = {};
var assocAllPoolsByExchange = {};
var currentActivePools = [];

var assocExchangeByWalletId = {};

var assocAllOperations = {};
var assocPendingOperationsByExchange = {};
var assocPendingOperationsByWalletId = {};
var assocStakedByKeyAndAddress = {};
var assocProofsByKeyAndOutcome = {};
var assocProofsByPairAndOutcome = {};
var assocLastOperationForPair = {};

var assocNicknamesByAddress = {};
var assocWalletOnOperation = {};
const assocAaParameters = {};

const assocUnconfirmedEvents = {};

const MAX_OPERATIONS = 200;

myWitnesses.readMyWitnesses(function (arrWitnesses) {
	if (arrWitnesses.length > 0)
		return start();
	myWitnesses.insertWitnesses(conf.initial_witnesses, start);
}, 'ignore');


function start(){
	lightWallet.setLightVendorHost(conf.hub);
	wallet_general.addWatchedAddress(conf.aa_address, function(error){
		if (error)
			console.log(error)
		else
			console.log(conf.aa_address + " added as watched address")
		indexAaParameters();
		indexFromStateVars();
		refresh();
		setInterval(refresh, 60 * 1000);
		eventBus.on('new_my_transactions', treatUnconfirmedEvents);
		eventBus.on('my_transactions_became_stable', discardUnconfirmedEventsAndUpdate);
		eventBus.on('sequence_became_bad', discardUnconfirmedEventsAndUpdate);
	});
}

function refresh(){
	lightWallet.refreshLightClientHistory();
}

function indexAaParameters(){
	getStateVarsForPrefixes(["min_stak","min_rewar"], function(error, objStateVars){
		if (error)
			throw Error("couldn't get AA parameters");
			assocAaParameters.min_stake = Number(objStateVars['min_stake']);
			assocAaParameters.min_reward = Number(objStateVars['min_reward']);
	});
}


function indexFromStateVars(handle){
	if (!handle)
		handle = ()=>{};
	getStateVarsForPrefixes(["pool_","operation_","pair_", "nickname_"], function(error, objStateVars){
		if (error){
			console.log(error);
			return handle();
		}
		indexOperations(objStateVars);
		indexRewardPools(objStateVars);
		indexNicknames(objStateVars);
		handle();
	});
}


function getStateVarsForPrefixes(arrPrefixes, handle){
	async.reduce(arrPrefixes, {}, function(memo, item, cb) {
		getStateVarsRangeForPrefix(item, "0", "z", function(error, result ){
			if (error)
				return cb(error);
			else
				return cb(null, Object.assign(memo, result));
			
		});
	}, function(error, result){
		if (error)
			return handle(error);
		else
			return handle(null, result);
	})
}

function getStateVarsRangeForPrefix(prefix, start, end, handle){
	const CHUNK_SIZE = 2000;
	network.requestFromLightVendor('light/get_aa_state_vars', {
		address: conf.aa_address,
		var_prefix_from: prefix + start,
		var_prefix_to: prefix + end,
		limit: CHUNK_SIZE
	}, function(ws, request, objResponse){
		if (objResponse.error)
			return handle(objResponse.error);

		if (Object.keys(objResponse).length >= CHUNK_SIZE){
			const delimiter =  Math.floor((end.charCodeAt(0) - start.charCodeAt(0)) / 2 + start.charCodeAt(0));
			async.parallel([function(cb){
				getStateVarsRange(prefix, start, String.fromCharCode(delimiter), cb)
			},
			function(cb){
				getStateVarsRange(prefix, String.fromCharCode(delimiter +1), end, cb)
			}
			], function(error, results){
				if (error)
					return handle(error);
				else
					return handle(null, {...results[0], ...results[1]});
			})
		} else {
			return handle(null, objResponse);
		}
	});
}


function treatUnconfirmedEvents(arrUnits){

	db.query("SELECT unit,payload,amount,unit_authors.address,units.timestamp FROM messages CROSS JOIN outputs USING(unit) \n\
	CROSS JOIN unit_authors USING(unit) \n\
	CROSS JOIN units USING(unit) \n\
	WHERE unit IN (?) AND app='data' AND outputs.address=? AND outputs.asset IS NULL GROUP BY messages.unit",
	[arrUnits, conf.aa_address], function(rows){
		rows.forEach(function(row){
			const params = {};
			params.trigger = {};
			params.trigger.data = JSON.parse(row.payload);
			params.trigger.address = row.address;
			params.trigger.outputs = {};
			params.trigger.outputs.base = row.amount;
			params.address = conf.aa_address;
			network.requestFromLightVendor('light/dry_run_aa',params, function(ws, request, arrResponses){
				if (arrResponses.error)
					return console.log(arrResponses.error);
				else {
					if (arrResponses[0] && arrResponses[0].response && arrResponses[0].response.responseVars){
						assocUnconfirmedEvents[row.unit] = parseEvent(params.trigger, arrResponses[0].response.responseVars);
						assocUnconfirmedEvents[row.unit].timestamp = row.timestamp;
						assocUnconfirmedEvents[row.unit].trigger_unit = row.unit;
						assocUnconfirmedEvents[row.unit].nickname = assocNicknamesByAddress[assocUnconfirmedEvents[row.unit].concerned_address] || null;
					}
				}
			})
		});
	});
}


function discardUnconfirmedEventsAndUpdate(arrUnits){
	arrUnits.forEach(function(unit){
		delete assocUnconfirmedEvents[unit];
	});
	indexFromStateVars(updateOperationsHistory);
}


function parseEvent(trigger, objResponse){

	function attachProofUrls(){
		for (var i=1; i<=5; i++){
			if (trigger.data["url_" + i]){
				if(!objEvent.proof_urls)
				objEvent.proof_urls = [];
				objEvent.proof_urls.push(trigger.data["url_" + i]);
			}
		}
	}

	const objEvent = {};
	objEvent.event_data = {};
	objEvent.paid_in = 0;
	objEvent.paid_out = 0;

	if (objResponse.operation_id){
		objEvent.operation_id = objResponse.operation_id;
		objEvent.pair = convertOperationKeyToPairKey(objResponse.operation_id);
	}
 if (objResponse.your_stake){
		objEvent.event_type = (objResponse.staked_on_in == 0 && objResponse.staked_on_out > 0 || objResponse.staked_on_out == 0 && objResponse.staked_on_in > 0) 
		? "initial_stake" : "stake";
		objEvent.paid_in = objResponse.accepted_amount;
		objEvent.concerned_address = trigger.address;
		objEvent.proposed_outcome = trigger.data.remove_wallet_id ? 'out' : 'in';
		objEvent.event_data.staked_on_in = objResponse.staked_on_in;
		objEvent.event_data.staked_on_out = objResponse.staked_on_out;
		objEvent.event_data.expected_reward = objResponse.expected_reward;
		objEvent.event_data.resulting_outcome = objResponse.resulting_outcome;
		attachProofUrls();
	} else if (objResponse.committed_outcome){
		objEvent.event_type = "commit";
		objEvent.paid_out = objResponse.paid_out_amount;
		objEvent.concerned_address = objResponse.paid_out_address;
	} else if (objResponse.paid_out_amount){
		objEvent.event_type = "withdraw";
		objEvent.paid_out = objResponse.paid_out_amount;
		objEvent.concerned_address = objResponse.paid_out_address;
	} else if (objResponse.created_pool){
		objEvent.event_type = "create_pool";
		objEvent.paid_in = objResponse.amount;
		objEvent.concerned_address = trigger.address;
	} else if (objResponse.destroyed_pool){
		objEvent.event_type = "destroy_pool";
		objEvent.paid_out = objResponse.amount;
		objEvent.concerned_address = trigger.address;
	}
	return objEvent;
}

//we push in an indexed table all information coming from aa responses
function updateOperationsHistory(){
	mutex.lockOrSkip(["updateOperationsHistory"], function(unlock){
		//units table is joined to get trigger unit timestamp
		db.query("SELECT * FROM aa_responses INNER JOIN units ON aa_responses.trigger_unit=units.unit WHERE mci >=(SELECT \n\
			CASE WHEN mci IS NOT NULL THEN MAX(mci) \n\
			ELSE 0 \n\
			END max_mci\n\
			FROM operations_history) AND aa_address=?", [conf.aa_address], function(rows){
				async.eachOf(rows, function(row, index, cb) {
					storage.readJoint(db, row.trigger_unit, {
					ifNotFound: function(){
						throw Error("bad unit not found: "+unit);
					},
					ifFound: function(objJoint){
						const trigger = aa_composer.getTrigger(objJoint.unit, conf.aa_address);
						const objResponse = JSON.parse(row.response).responseVars;
						if(!objResponse)
							return cb();

						 const objEvent = parseEvent(trigger, objResponse);
						 console.log(objEvent);

						if (objEvent.event_type){
							db.query("INSERT "+db.getIgnore()+" INTO operations_history (operation_id, paid_in, paid_out, concerned_address, pair, event_type, mci, aa_address, event_data, trigger_unit,timestamp) VALUES \n\
							(?,?,?,?,?,?,?,?,?,?,?)",[objEvent.operation_id, objEvent.paid_in, objEvent.paid_out, objEvent.concerned_address, objEvent.pair, objEvent.event_type, row.mci, row.aa_address, JSON.stringify(objEvent.event_data), row.trigger_unit, row.timestamp],
							function(result){
								if (result.affectedRows === 1){
									objEvent.exchange = exchanges.getExchangeName[objResponse.exchange];

									exchanges.updateRankingRow(objEvent.operation_id,null, {});

									social_networks.notify(
										objEvent.event_type, 
										assocAllOperations[objEvent.operation_id], 
										assocNicknamesByAddress[objEvent.concerned_address] || objEvent.concerned_address, 
										objEvent.event_data
									);
								}
								cb();
							});
						} else
							cb();
					}
				})
			}, unlock);
		})
	});
}

//we read state vars to index pool rewards in assocAllPoolsByExchange
function indexRewardPools(objStateVars){

	const poolKeys = extractPoolKeys(objStateVars);
	const assocPoolsById = {};
	const activePools = [];
	var assocPoolsByExchange = {};
	poolKeys.forEach(function(poolKey){
		const pool = {};
		pool.number_rewards = Number(objStateVars[poolKey+'_number_of_rewards']);
		pool.pool_id = poolKey.split('_')[1];
		pool.sponsor = objStateVars[poolKey+'_sponsor']
		pool.reward_amount = Number(objStateVars[poolKey+'_reward_amount']);
		if (objStateVars[poolKey+'_exchange'] != undefined)
			pool.exchange = objStateVars[poolKey+'_exchange'];
		else
			pool.exchange = 'any';
		assocPoolsById[pool.pool_id] = pool;
		if(pool.number_rewards > 0)
			activePools.push(pool);
		if (!assocPoolsByExchange[pool.exchange])
			assocPoolsByExchange[pool.exchange] = [];
		assocPoolsByExchange[pool.exchange].push(pool);
		
	});
	currentActivePools = activePools;
	assocAllPoolsById = assocPoolsById;
	assocAllPoolsByExchange = assocPoolsByExchange;
}

//we read state vars to read all past and ongoing operations and sort them in different associative arrays
function indexOperations(objStateVars){
	console.log(JSON.stringify(objStateVars));
	extractStakedByKeyAndAddress(objStateVars);
	extractProofUrls(objStateVars);
	
	const operationKeys = extractOperationKeys(objStateVars);
	const assocOperations = {};
	const arrOperations = [];

	const _assocPendingOperationsByExchange = {};
	const assocWalletIdsByExchange = {};
	const _assocPendingOperationsByWalletId = {};
	const _assocExchangeByWalletId = {};
	const _assocWalletOnOperation = {};
	const _assocLastOperationForPair = {};

	operationKeys.forEach(function(key){
		const operation = {};
		operation.status = objStateVars[key];
		const pairKey = convertOperationKeyToPairKey(key);
		const exchange = getExchangeFromOperationKey(key);
		const wallet_id = getWalletIdFromOperationKey(key);
		operation.exchange = exchange;

		operation.wallet_id = Number(wallet_id);
		operation.exchange = exchange;
		operation.number = Number(objStateVars[pairKey + "_number"]);

		if(!assocWalletIdsByExchange[exchange])
			assocWalletIdsByExchange[exchange] = [];
		if (objStateVars[pairKey + "_committed_outcome"] == "in") {
			if (assocWalletIdsByExchange[exchange].indexOf(wallet_id) === -1)
				assocWalletIdsByExchange[exchange].push(Number(wallet_id));
				_assocExchangeByWalletId[wallet_id] = exchange;
		}
		const outcome = objStateVars[key + "_outcome"]
		operation.outcome = outcome;
		if (operation.status == 'onreview')
			_assocWalletOnOperation[wallet_id] = true;
		operation.committed_outcome = objStateVars[pairKey + "_committed_outcome"];
		operation.initial_outcome = objStateVars[key + "_initial_outcome"];
		operation.staked_on_outcome = Number(objStateVars[key + "_total_staked_on_" + outcome]);
		operation.staked_on_opposite = Number(objStateVars[key + "_total_staked_on_" + (outcome == "in" ? "out" :"in")] || 0);
		operation.countdown_start= Number(objStateVars[key + "_countdown_start"]);
		operation.total_staked = Number(objStateVars[key + "_total_staked_on_in"] || 0) + Number(objStateVars[key + "_total_staked_on_out"] || 0);
		operation.pool_id = Number(objStateVars[key + "_pool_id"]);
		operation.key = key;
		operation.staked_by_address = assocStakedByKeyAndAddress[key];
		operation.url_proofs_by_outcome = assocProofsByKeyAndOutcome[key]
		arrOperations.push(operation);
		if (!_assocLastOperationForPair[pairKey])
			_assocLastOperationForPair[pairKey] = operation;
		else if (operation.number > _assocLastOperationForPair[pairKey].number)
			_assocLastOperationForPair[pairKey] = operation;

	});

	arrOperations.sort(function(a, b) { return b.countdown_start - a.countdown_start});


	arrOperations.slice(0, MAX_OPERATIONS).forEach(function(operation){
		assocOperations[operation.key] = operation;
	});

	arrOperations.forEach(function(operation){
		if (operation.status != 'onreview')
			return;
		if(!_assocPendingOperationsByExchange[operation.exchange])
			_assocPendingOperationsByExchange[operation.exchange] = [];
		_assocPendingOperationsByExchange[operation.exchange].push(operation);
		if(!_assocPendingOperationsByWalletId[operation.wallet_id])
			_assocPendingOperationsByWalletId[operation.wallet_id] = [];
		_assocPendingOperationsByWalletId[operation.wallet_id].push(operation);
	});

	assocAllOperations = assocOperations;
	assocExchangeByWalletId = _assocExchangeByWalletId;
	assocPendingOperationsByExchange = _assocPendingOperationsByExchange;
	assocPendingOperationsByWalletId = _assocPendingOperationsByWalletId;
	assocWalletOnOperation = _assocWalletOnOperation;
	assocLastOperationForPair= _assocLastOperationForPair;
	exchanges.setWalletIdsByExchange(assocWalletIdsByExchange);
}


function extractProofUrls(objStateVars){
	assocProofsByKeyAndOutcome = {};
	assocProofsByPairAndOutcome = {};
	for (var key in objStateVars){
		if (key.indexOf("operation_") == 0){
		var splitKey = key.split('_');
		 if (splitKey[4] == "url" && splitKey[5] == "proof"){
			var outcome = splitKey[7];
			var operation_key = splitKey[0] + '_' + splitKey[1] + '_' + splitKey[2] + '_' + splitKey[3];
			var pair = splitKey[1] + '_' + splitKey[2];

			if (!assocProofsByKeyAndOutcome[operation_key])
				assocProofsByKeyAndOutcome[operation_key] = {};
			if(!assocProofsByKeyAndOutcome[operation_key][outcome])
				assocProofsByKeyAndOutcome[operation_key][outcome] = [];
			assocProofsByKeyAndOutcome[operation_key][outcome].push(objStateVars[key]);

			if (!assocProofsByPairAndOutcome[pair])
			assocProofsByPairAndOutcome[pair] = {};
			if(!assocProofsByPairAndOutcome[pair][outcome])
			assocProofsByPairAndOutcome[pair][outcome] = [];
			assocProofsByPairAndOutcome[pair][outcome].push(objStateVars[key]);
		 }
		}
	}
}

function indexNicknames(objStateVars){
	for (var key in objStateVars){
		if (key.indexOf("nickname_") == 0){
			var splitKey = key.split('_');
			assocNicknamesByAddress[splitKey[1]] = objStateVars[key];
		}
	}
}

function extractStakedByKeyAndAddress(objStateVars){
	assocStakedByKeyAndAddress = {};
	for (var key in objStateVars){
		if (key.indexOf("operation_") == 0){
			var splitKey = key.split('_');
			if (splitKey[4] == "total" && splitKey[8] == "by"){
				var address = splitKey[9];
				var outcome = splitKey[7];
				var operation_key = splitKey[0] + '_' + splitKey[1] + '_' + splitKey[2] + '_' + splitKey[3];
				if (!assocStakedByKeyAndAddress[operation_key])
					assocStakedByKeyAndAddress[operation_key] = {};
				if(!assocStakedByKeyAndAddress[operation_key][address])
					assocStakedByKeyAndAddress[operation_key][address] = {};
				assocStakedByKeyAndAddress[operation_key][address][outcome]= objStateVars[key];
			}
		}
	}
}


function extractOperationKeys(objStateVars){
	const assocOperationKeys = {};
	 for (var key in objStateVars){
		 if (key.indexOf("operation_") == 0){
			var splitKey = key.split('_');
			assocOperationKeys[splitKey[0] + '_' + splitKey[1] + '_' + splitKey[2] + '_' + splitKey[3]] = true;
		 }
	 }
	 const operationKeys = [];
	 for (var key in assocOperationKeys){
		operationKeys.push(key);
	 }
	 return operationKeys;
 }


function convertOperationKeyToPairKey(operationKey){
	var splitKey = operationKey.split('_');
	return 	"pair_" + splitKey[1] + "_" + splitKey[2];
}

function getExchangeFromOperationKey(operationKey){
	var splitKey = operationKey.split('_');
	return splitKey[1];
}

function getWalletIdFromOperationKey(operationKey){
	var splitKey = operationKey.split('_');
	return splitKey[2];
}


function extractPoolKeys(objStateVars){
	const assocPoolKeys = {};
	 for (var key in objStateVars){
		 if (key != "pool_id" && key.indexOf("pool_") == 0){
			assocPoolKeys[key.slice(0, 6)] = true;
		 }
	 }
 
	 const poolKeys = [];
	 for (var key in assocPoolKeys){
		poolKeys.push(key);
	 }
	 return poolKeys;
}
 
function getNicknameForAddress(address){
	return assocNicknamesByAddress[address];
}

function getAllPools(){
	return currentActivePools;
}

function getAaParameters(){
	return assocAaParameters;
}

function getAllOperations(){
	return Object.values(assocAllOperations);
}

function getPendingOperationsForExchange(exchange){
	return assocPendingOperationsByExchange[exchange] || [];
}

function getPendingOperationsForWalletId(wallet_id){
	return assocPendingOperationsByWalletId[wallet_id] || [];
}

function getIsWalletOnOperation(wallet_id){
	return !!assocWalletOnOperation[wallet_id];
}

function getExchangeByWalletId(wallet_id){
	return assocExchangeByWalletId[wallet_id];
}

function getUrlProofsForPair(wallet_id, exchange_id){
	return assocProofsByPairAndOutcome[ exchange_id+ "_" + wallet_id] || {};
}

function getLastOperationHistoryForPair(wallet_id, exchange_id, handle){
	const pair = "pair_" + exchange_id + "_" + wallet_id;
	console.log(pair)
	console.log(assocLastOperationForPair)

	if (!assocLastOperationForPair[pair])
		return handle('no last operation found');
	else
	getOperationHistory(assocLastOperationForPair[pair].key, function(objHistory){
		console.log(objHistory);
		return handle(null, objHistory);
	});
}


function getBestPoolForExchange(exchange){
	var bestPool = {
		reward_amount: 0
	};
	for (var key in assocAllPoolsByExchange[exchange]){
		if (assocAllPoolsByExchange[exchange][key].number_rewards > 0 && assocAllPoolsByExchange[exchange][key].reward_amount > bestPool.reward_amount)
			bestPool = assocAllPoolsByExchange[exchange][key];
	}
	
	for (var key in assocAllPoolsByExchange["any"]){
		if (assocAllPoolsByExchange["any"][key].number_rewards > 0 && assocAllPoolsByExchange["any"][key].reward_amount > bestPool.reward_amount)
			bestPool = assocAllPoolsByExchange["any"][key];
	}
	return bestPool;


}

function getLastEvents(handle){
	db.query("SELECT event_type,timestamp,event_data,paid_in,paid_out,concerned_address,trigger_unit,operation_id FROM operations_history ORDER BY mci DESC LIMIT 20",
	 function(rows){
		const confirmed_events = rows.map(function(row){
			var objEventData = JSON.parse(row.event_data);
			return {
				event_data: objEventData, 
				timestamp: row.timestamp, 
				paid_in: row.paid_in,
				paid_out: row.paid_out,
				concerned_address: row.concerned_address,
				event_type: row.event_type,
				trigger_unit: row.trigger_unit,
				is_confirmed: true,
				operation: assocAllOperations[row.operation_id],
				nickname:  assocNicknamesByAddress[row.concerned_address] || null
			};
		})
		const unconfirmed_events = Object.values(assocUnconfirmedEvents)
		unconfirmed_events.forEach((event)=>{
			event.operation = assocAllOperations[event.operation_id] || null;
			event.nickname = assocNicknamesByAddress[event.concerned_address] || null;
		});
		const allEvents = confirmed_events.concat(unconfirmed_events).sort(function(a, b){
			return a.timestamp - b.timestamp;
		});
		return handle(allEvents);
	})
}


function getLastTransactionsToAA(handle){

	db.query("SELECT is_stable,payload,units.unit,timestamp FROM units INNER JOIN outputs USING(unit) INNER JOIN messages USING(unit) WHERE outputs.address=? ORDER BY main_chain_index DESC",[conf.aa_address],
	function(rows){
		var results = [];
		rows.forEach(function(row){
			if (!row.payload)
				return null;
			const payload = JSON.parse(row.payload);
			if	(payload.withdraw)
				return results.push({type:"withdrawal", unit: row.unit,timestamp: row.timestamp, is_stable: row.is_stable});
			if	(payload.commit)
				return results.push({type:"commit", unit: row.unit,timestamp: row.timestamp, is_stable: row.is_stable});
			if	(payload.add_wallet_id)
				return results.push({type:"add", unit: row.unit,timestamp: row.timestamp, is_stable: row.is_stable});
			if	(payload.remove_wallet_id)
				return results.push({type:"remove", unit: row.unit,timestamp: row.timestamp, is_stable: row.is_stable});
			if	(payload.reward_amount)
				return results.push({type:"donate", unit: row.unit,timestamp: row.timestamp, is_stable: row.is_stable});
		});
		return handle(results);
	});
}

function getOperationHistory(id, handle){
	db.query("SELECT event_type,timestamp,event_data,paid_in,paid_out,concerned_address FROM operations_history WHERE operation_id=? ORDER BY mci DESC",[id], function(rows){
		rows = rows.map(function(row){
			var objEventData = JSON.parse(row.event_data);
			const nickname = assocNicknamesByAddress[row.concerned_address] || null;
			return {
				event_data: objEventData, 
				timestamp: row.timestamp, 
				paid_in: row.paid_in,
				paid_out: row.paid_out,
				concerned_address: row.concerned_address,
				event_type: row.event_type,
				nickname
			};
		})
		return handle({
			history: rows, operation: assocAllOperations[id]
		});
	});
}


function getContributorsRanking(handle){
	db.query("SELECT CASE WHEN initiatives IS NOT NULL THEN initiatives \n\
	ELSE 0 \n\
	END initiatives,\n\
	CASE WHEN successes IS NOT NULL THEN successes \n\
	ELSE 0 \n\
	END successes,\n\
	income,s1.address FROM\n\
	(SELECT concerned_address AS address FROM operations_history GROUP BY address)s1 \n\
	LEFT JOIN\n\
	(SELECT COUNT(*) AS successes, concerned_address AS address FROM operations_history WHERE event_type='commit' GROUP BY address)s2 USING (address) \n\
	LEFT JOIN\n\
	(SELECT COUNT(*) AS initiatives, concerned_address AS address FROM operations_history WHERE event_type='initial_stake' GROUP BY address)s3 USING (address) \n\
	LEFT JOIN\n\
	(SELECT (SUM(paid_out) - SUM(paid_in)) as income, concerned_address AS address FROM operations_history \n\
	WHERE (event_type='initial_stake' OR event_type='stake' OR event_type='withdraw' OR event_type='commit') GROUP BY address)s4 USING (address)",
	function(rows){
		rows.forEach(function(row){
			if (assocNicknamesByAddress[row.address])
				row.nickname = assocNicknamesByAddress[row.address];
		})
		handle(rows);
	});
}

function getDonorsRanking(handle){
	db.query("SELECT (SUM(paid_in) - SUM(paid_out)) as amount, concerned_address AS address FROM operations_history \n\
	WHERE (event_type='create_pool' OR event_type='destroyed_pool') \n\
	GROUP BY concerned_address",function(rows){
		rows.forEach(function(row){
			if (assocNicknamesByAddress[row.address])
				row.nickname = assocNicknamesByAddress[row.address];
		})
		handle(rows);
	});
}

function getContributorsGreeting(handle){
	db.query("SELECT operation_id,timestamp,event_data FROM operations_history WHERE event_type='commit' ORDER BY mci DESC LIMIT 50", function(rows){
		var arrGreetings = [];
		for (var i = 0; i < rows.length; i++){
			var objEvent = rows[i].event_data ? JSON.parse(rows[i].event_data) : null;
			var objOperation = assocAllOperations[rows[i].operation_id];
			if (objEvent && objOperation && objEvent.committed_outcome == objOperation.initial_outcome){
				var sponsorAddress = assocAllPoolsById[objOperation.pool_id] ? assocAllPoolsById[objOperation.pool_id].sponsor : null;
				arrGreetings.push({
					author: assocNicknamesByAddress[objEvent.paid_out_address] || objEvent.paid_out_address,
					exchange: objOperation.exchange, 
					outcome: objOperation.initial_outcome, 
					sponsor: assocNicknamesByAddress[sponsorAddress] || sponsorAddress
				});
			}
		}
		handle(arrGreetings);
	});
}

exports.getAllPools = getAllPools;
exports.getAllOperations = getAllOperations;
exports.getPendingOperationsForExchange = getPendingOperationsForExchange;
exports.getBestPoolForExchange = getBestPoolForExchange;
exports.getExchangeByWalletId = getExchangeByWalletId;
exports.getLastTransactionsToAA = getLastTransactionsToAA;
exports.getOperationHistory = getOperationHistory;
exports.getContributorsRanking = getContributorsRanking;
exports.getDonorsRanking = getDonorsRanking;
exports.getNicknameForAddress = getNicknameForAddress;
exports.getContributorsGreeting = getContributorsGreeting;
exports.getAaParameters = getAaParameters;
exports.getPendingOperationsForWalletId = getPendingOperationsForWalletId;
exports.getIsWalletOnOperation = getIsWalletOnOperation;
exports.getUrlProofsForPair = getUrlProofsForPair;
exports.getLastOperationHistoryForPair = getLastOperationHistoryForPair;
exports.getLastEvents = getLastEvents;