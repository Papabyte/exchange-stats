const conf = require('ocore/conf.js');
const lightWallet = require('ocore/light_wallet.js');
const myWitnesses = require('ocore/my_witnesses.js');
const async = require('async');
const isUrl = require('is-url')
const mutex = require('ocore/mutex.js');
const network = require('ocore/network.js');
const wallet_general = require('ocore/wallet_general.js');
const aa_composer = require('ocore/aa_composer.js');
const storage = require('ocore/storage.js');
const db = require('ocore/db.js');
const social_networks = require('./social_networks.js');
const eventBus = require('ocore/event_bus.js');
const explorer = require('./explorer.js');
const exchanges = require('./exchanges.js')

var assocAllPoolsById = {};
var assocAllPoolsByExchange = {};
var currentActivePools = [];

var assocExchangeByRedirectedWalletId = {};
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

// we insert witnesses when node is started first time ever
myWitnesses.readMyWitnesses(function (arrWitnesses) {
	if (arrWitnesses.length > 0)
		return start();
	myWitnesses.insertWitnesses(conf.initial_witnesses, start);
}, 'ignore');


function start(){
	lightWallet.setLightVendorHost(conf.hub);
	// the AA address is watched so we receive transactions implying it
	wallet_general.addWatchedAddress(conf.aa_address, function(error){
		if (error)
			console.log(error)
		else
			console.log(conf.aa_address + " added as watched address")
		refresh();
		indexAaParameters();
		indexFromStateVars(updateOperationsHistory);
		setInterval(refresh, 60 * 1000);
		eventBus.on('new_my_transactions', treatUnconfirmedEvents);
		eventBus.on('my_transactions_became_stable', discardUnconfirmedEventsAndUpdate);
		eventBus.on('sequence_became_bad', discardUnconfirmedEventsAndUpdate);
	});
}

function refresh(){
	lightWallet.refreshLightClientHistory();
}

// we get the parameters that are set by control address, node is to be restarted when they are changed
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
	getStateVarsForPrefixes(["pool_","operation_","pair_", "nickname_"], async function(error, objStateVars){
		if (error){
			console.log(error);
			return handle();
		}
		await indexOperations(objStateVars);
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

// since hub returns a limited number of state vars, this function read them by chunk when limit is reached
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

// we dry run AA with units just sent to it, parse unconfirmed events and store them in assocUnconfirmedEvents
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
						const objEvent = parseEvent(params.trigger, arrResponses[0].response.responseVars);
						if(objEvent.event_type){
							objEvent.timestamp = row.timestamp;
							objEvent.trigger_unit = row.unit;
							objEvent.nickname = assocNicknamesByAddress[objEvent.concerned_address] || null;
							objEvent.event_data.author_nickname = assocNicknamesByAddress[objEvent.event_data.author] || null;
							assocUnconfirmedEvents[row.unit] = objEvent;
						}
					}
				}
			})
		});
	});
}

// once an unit is confirmed, the corresponding event isn't unconfirmed anymore so we remove it from assocUnconfirmedEvents
function discardUnconfirmedEventsAndUpdate(arrUnits){
	arrUnits.forEach(function(unit){
		delete assocUnconfirmedEvents[unit];
	});
	// there must be something new since an unit concerning AA has been confirmed, so we read AA state vars and update global associative arrays
	indexFromStateVars(updateOperationsHistory);
}

// this function returns an event object from an AA trigger and its response, it's used for both unconfirmed and confirmed events
function parseEvent(trigger, objResponse){

	function attachProofUrls(){
		for (var i=1; i<=5; i++){
			if (trigger.data["url_" + i]){
				if(!objEvent.event_data.proof_urls)
				objEvent.event_data.proof_urls = [];
				if (isUrl(trigger.data["url_" + i]))
					objEvent.event_data.proof_urls.push(trigger.data["url_" + i]);
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
		objEvent.event_type = (objResponse.staked_on_in == 0 && objResponse.staked_on_out > 0 || objResponse.staked_on_out == 0 && objResponse.staked_on_in > 0) ? "initial_stake" : "stake";
		objEvent.paid_in = objResponse.accepted_amount;
		objEvent.concerned_address = trigger.address;
		objEvent.event_data.proposed_outcome = trigger.data.remove_wallet_id ? 'out' : 'in';
		objEvent.event_data.staked_on_in = objResponse.staked_on_in;
		objEvent.event_data.staked_on_out = objResponse.staked_on_out;
		objEvent.event_data.expected_reward = objResponse.expected_reward;
		objEvent.event_data.resulting_outcome = objResponse.resulting_outcome;
		attachProofUrls();
	} else if (objResponse.committed_outcome){
		objEvent.event_type = "commit";
		objEvent.paid_out = objResponse.paid_out_amount;
		objEvent.concerned_address = objResponse.paid_out_address;
		objEvent.event_data.committed_outcome = objResponse.committed_outcome;
		objEvent.event_data.author = trigger.address;
	} else if (objResponse.paid_out_amount){
		objEvent.event_type = "withdraw";
		objEvent.paid_out = objResponse.paid_out_amount;
		objEvent.concerned_address = objResponse.paid_out_address;
	} else if (objResponse.created_pool){
		objEvent.event_type = "create_pool";
		objEvent.paid_in = objResponse.amount;
		objEvent.concerned_address = trigger.address;
		objEvent.event_data.reward_amount = Number(trigger.data.reward_amount);
		objEvent.event_data.number_of_rewards = Number(trigger.data.number_of_rewards);
		objEvent.event_data.exchange = trigger.data.exchange;
	} else if (objResponse.destroyed_pool){
		objEvent.event_type = "destroy_pool";
		objEvent.paid_out = objResponse.amount;
		objEvent.concerned_address = trigger.address;
	}
	return objEvent;
}

// we push in a table all confirmed events, they can be sorted by operation_id, paid_in, paid_out, concerned_address, pair and event_type
// operation histories are constructed from this table, as well as contributors/donors statistics 
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
						if (objEvent.event_type){
							db.query("INSERT "+db.getIgnore()+" INTO operations_history (operation_id, paid_in, paid_out, concerned_address, pair, event_type, mci, aa_address, event_data, trigger_unit,timestamp) VALUES \n\
							(?,?,?,?,?,?,?,?,?,?,?)",[objEvent.operation_id, objEvent.paid_in, objEvent.paid_out, objEvent.concerned_address, objEvent.pair, objEvent.event_type, row.mci, row.aa_address, JSON.stringify(objEvent.event_data), row.trigger_unit, row.timestamp],
							function(result){
								if (result.affectedRows === 1){
									//if the event is a commit, we update its ranking right now
									if (objEvent.event_type == 'commit')
										exchanges.updateRankingRow(getExchangeFromOperationKey(objEvent.operation_id), {});

										objEvent.concerned_address_nickname = assocNicknamesByAddress[objEvent.concerned_address] || objEvent.concerned_address;
										objEvent.event_data.committer = assocNicknamesByAddress[objEvent.event_data.committer] || objEvent.event_data.committer;
									social_networks.notify(
										objEvent, 
										assocAllOperations[objEvent.operation_id]
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
async function indexOperations(objStateVars){
	indexStakedByKeyAndAddress(objStateVars);
	indexProofUrls(objStateVars);
	
	const operationIds = extractOperationKeys(objStateVars);
	const assocOperations = {};
	const arrOperations = [];

	const _assocPendingOperationsByExchange = {};
	const assocWalletIdsByExchange = {};
	const _assocPendingOperationsByWalletId = {};
	const _assocExchangeByWalletId = {};
	const _assocWalletOnOperation = {};
	const _assocLastOperationForPair = {};

	operationIds.forEach(function(operation_id){
		const operation = {};
		operation.status = objStateVars[operation_id];
		const pairKey = convertOperationKeyToPairKey(operation_id);
		const exchange = getExchangeFromOperationKey(operation_id);
		const wallet_id = getWalletIdFromOperationKey(operation_id);
		operation.exchange = exchange;

		operation.wallet_id = Number(wallet_id);
		operation.exchange = exchange;
		operation.number = Number(objStateVars[pairKey + "_number"]);

		if (objStateVars[pairKey + "_committed_outcome"] == "in") {
			if(!assocWalletIdsByExchange[exchange])
				assocWalletIdsByExchange[exchange] = [];
			if (assocWalletIdsByExchange[exchange].indexOf(operation.wallet_id) === -1)
				assocWalletIdsByExchange[exchange].push(operation.wallet_id);
			_assocExchangeByWalletId[wallet_id] = exchange;
		}
		const outcome = objStateVars[operation_id + "_outcome"]
		operation.outcome = outcome;
		if (operation.status == 'onreview')
			_assocWalletOnOperation[wallet_id] = true;
		operation.committed_outcome = objStateVars[pairKey + "_committed_outcome"];
		operation.initial_outcome = objStateVars[operation_id + "_initial_outcome"];
		operation.staked_on_outcome = Number(objStateVars[operation_id + "_total_staked_on_" + outcome]);
		operation.staked_on_opposite = Number(objStateVars[operation_id + "_total_staked_on_" + (outcome == "in" ? "out" :"in")] || 0);
		operation.countdown_start= Number(objStateVars[operation_id + "_countdown_start"]);
		operation.total_staked = Number(objStateVars[operation_id + "_total_staked_on_in"] || 0) + Number(objStateVars[operation_id + "_total_staked_on_out"] || 0);
		operation.pool_id = Number(objStateVars[operation_id + "_pool_id"]);
		operation.operation_id = operation_id;
		operation.staked_by_address = assocStakedByKeyAndAddress[operation_id];
		operation.url_proofs_by_outcome = assocProofsByKeyAndOutcome[operation_id]
		arrOperations.push(operation);
		if (!_assocLastOperationForPair[pairKey])
			_assocLastOperationForPair[pairKey] = operation;
		else if (operation.number > _assocLastOperationForPair[pairKey].number)
			_assocLastOperationForPair[pairKey] = operation;

	});

	arrOperations.sort(function(a, b) { return b.countdown_start - a.countdown_start});

	arrOperations.slice(0, MAX_OPERATIONS).forEach(function(operation){
		assocOperations[operation.operation_id] = operation; // assocOperations is limited is size, so client receive only last ones 
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

	const assocRedirections = await explorer.getRedirections(Object.keys(_assocExchangeByWalletId));
	for (var key in assocRedirections){
		assocExchangeByRedirectedWalletId[key] = _assocExchangeByWalletId[assocRedirections[key]];
	}

	assocExchangeByWalletId = _assocExchangeByWalletId;
	assocPendingOperationsByExchange = _assocPendingOperationsByExchange;
	assocPendingOperationsByWalletId = _assocPendingOperationsByWalletId;
	assocWalletOnOperation = _assocWalletOnOperation;
	assocLastOperationForPair= _assocLastOperationForPair;
	exchanges.setWalletIdsByExchange(assocWalletIdsByExchange);
	exchanges.setPendingOperationsByExchange(assocPendingOperationsByExchange);
}

// read state vars that are like 'operation_abcc_8094_1_url_proof_for_in_1' and index data in assocProofsByKeyAndOutcome and assocProofsByPairAndOutcome
function indexProofUrls(objStateVars){
	assocProofsByKeyAndOutcome = {};
	assocProofsByPairAndOutcome = {};
	for (var key in objStateVars){
		if (key.indexOf("operation_") == 0){
		var splitKey = key.split('_');
		 if (splitKey[4] == "url" && splitKey[5] == "proof" && isUrl(objStateVars[key])){
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

// read state vars that are like 'nickname_CYPIJ2YETA6R6PWDY5XTXO2CABLZ4KVJ' and index data in assocNicknamesByAddress
function indexNicknames(objStateVars){
	for (var key in objStateVars){
		if (key.indexOf("nickname_") == 0){
			var splitKey = key.split('_');
			assocNicknamesByAddress[splitKey[1]] = objStateVars[key];
		}
	}
}

// read state vars that are like 'operation_abcc_8094_1_total_staked_on_in_by_72VNGUBSFLCD2T6SA63AQKP5DFD77BKU' and index data in assocStakedByKeyAndAddress
function indexStakedByKeyAndAddress(objStateVars){
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

// return a set of all existing operation ids
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

function getExchangeByRedirectedWalletId(wallet_id){
	return assocExchangeByRedirectedWalletId[wallet_id];
}

function getExchangeByWalletId(wallet_id){
	return assocExchangeByWalletId[wallet_id];
}

function getUrlProofsForPair(wallet_id, exchange_id){
	return assocProofsByPairAndOutcome[ exchange_id+ "_" + wallet_id] || {};
}

function getLastOperationHistoryForPair(wallet_id, exchange_id, handle){
	const pair = "pair_" + exchange_id + "_" + wallet_id;
	if (!assocLastOperationForPair[pair])
		return handle('no last operation found');
	else
	getOperationHistory(assocLastOperationForPair[pair].operation_id, function(objHistory){
		return handle(null, objHistory);
	});
}

// we find greatest reward for a given exchange
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

// returns all unconfirmed events and some last confirmed events
function getLastEvents(handle){
	db.query("SELECT event_type,timestamp,event_data,paid_in,paid_out,concerned_address,trigger_unit,operation_id FROM operations_history ORDER BY mci DESC LIMIT 20",
	 function(rows){
		const confirmed_events = rows.map(function(row){
			var objEventData = JSON.parse(row.event_data);
			objEventData.author_nickname = assocNicknamesByAddress[objEventData.author] || null;

			return {
				event_data: objEventData, 
				timestamp: row.timestamp, 
				paid_in: row.paid_in,
				paid_out: row.paid_out,
				concerned_address: row.concerned_address,
				event_type: row.event_type,
				trigger_unit: row.trigger_unit,
				is_confirmed: true,
				operation_id: row.operation_id,
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


//get history for a given operation
function getOperationHistory(id, handle){
	db.query("SELECT event_type,timestamp,event_data,paid_in,paid_out,concerned_address,trigger_unit FROM operations_history WHERE operation_id=? ORDER BY mci DESC",[id], function(rows){
		rows = rows.map(function(row){
			var objEventData = JSON.parse(row.event_data);
			const nickname = assocNicknamesByAddress[row.concerned_address] || null;
			objEventData.author_nickname = assocNicknamesByAddress[objEventData.author] || null;
			return {
				event_data: objEventData, 
				timestamp: row.timestamp, 
				paid_in: row.paid_in,
				paid_out: row.paid_out,
				concerned_address: row.concerned_address,
				event_type: row.event_type,
				unit: row.trigger_unit,
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
	db.query("SELECT operation_id,timestamp,event_data,concerned_address FROM operations_history WHERE event_type='commit' ORDER BY mci DESC LIMIT 50", function(rows){
		var arrGreetings = [];
		for (var i = 0; i < rows.length; i++){
			var objEventData = JSON.parse(rows[i].event_data);
			var objOperation = assocAllOperations[rows[i].operation_id];
			console.log(objEventData)
			if (objEventData && objOperation && objEventData.committed_outcome == objOperation.initial_outcome){
				var sponsorAddress = assocAllPoolsById[objOperation.pool_id] ? assocAllPoolsById[objOperation.pool_id].sponsor : null;
				arrGreetings.push({
					author: assocNicknamesByAddress[rows[i].concerned_address] || rows[i].concerned_address,
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
exports.getExchangeByRedirectedWalletId = getExchangeByRedirectedWalletId;
exports.getExchangeByWalletId = getExchangeByWalletId;
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
