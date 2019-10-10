const conf = require('ocore/conf.js');
const light_wallet = require('ocore/light_wallet.js');
const myWitnesses = require('ocore/my_witnesses.js');

const network = require('ocore/network.js');
const db = require('ocore/db.js');

const exchanges = require('./exchanges.js')

var currentPools = [];
var assocCurrentPoolsByExchange = {};

var assocCurrentExchangeByWalletId = {};

var currentOperations = [];
var assocCurrentOperationsByExchange = {};
var assocStakedByKeyAndAddress = {};
var assocProofsByKeyAndOutcome = {}
const assocWalletIdsByExchange = {};

myWitnesses.readMyWitnesses(function (arrWitnesses) {
	if (arrWitnesses.length > 0)
		return start();
	myWitnesses.insertWitnesses(conf.initial_witnesses, start);
}, 'ignore');


function start(){
	light_wallet.setLightVendorHost(conf.hub);
	db.query("INSERT "+db.getIgnore()+" INTO my_watched_addresses (address) VALUES (?)", [conf.aa_address], function(){
		network.addLightWatchedAddress(conf.address);
		refresh(),
		setInterval(refresh, 60 *1000);
	});
}

function refresh(){
	network.requestFromLightVendor('light/get_aa_state_vars', {address: conf.aa_address},function(error, request, objStateVars){

		indexOperations(objStateVars);
		indexRewardPools(objStateVars);

	});

}

function indexRewardPools(objStateVars){

	const poolKeys = extractPoolKeys(objStateVars);
	const pools = [];
	assocPoolsByExchange
	//var currentPools = [];
	var assocPoolsByExchange = {};
	poolKeys.forEach(function(poolKey){
		if(objStateVars[poolKey+'_number_of_rewards'] > 0){
			const pool = {};
			pool.number_rewards = objStateVars[poolKey+'_number_of_rewards'];
			pool.pool_id = poolKey.split('_')[1];

			pool.reward_amount = objStateVars[poolKey+'_reward_amount'];
			if (objStateVars[poolKey+'_exchange'] != undefined)
				pool.exchange = objStateVars[poolKey+'_exchange'];
			else
				pool.exchange = 'any';
			pools.push(pool);
			if (!assocPoolsByExchange[pool.exchange])
				assocPoolsByExchange[pool.exchange] = [];
			assocPoolsByExchange[pool.exchange].push(pool);
		}
	});

	currentPools = pools;
	assocCurrentPoolsByExchange = assocPoolsByExchange;
}

function indexOperations(objStateVars){
	extractStakedByKeyAndAddress(objStateVars);
	extractProofUrls(objStateVars);
	const operationKeys = extractOperationKeys(objStateVars);
	const operations = [];
	const assocOperationsByExchange = {};
	const assocWalletIdsByExchange = {};
	const assocExchangeByWalletId = {};

	operationKeys.forEach(function(key){

		const operation = {};
		operation.status = objStateVars[key];
		const pairKey = convertOperationKeyToPairKey(key)
		const exchange = objStateVars[pairKey + "_exchange"];
		const wallet_id = objStateVars[pairKey + "_wallet_id"];
		operation.exchange = exchange;
		operation.wallet_id = wallet_id;

		if(!assocWalletIdsByExchange[exchange])
			assocWalletIdsByExchange[exchange] = [];
		if (objStateVars[pairKey + "_committed_outcome"] == "in") {
			assocWalletIdsByExchange[exchange].push(wallet_id);
			assocExchangeByWalletId[wallet_id] = exchange;
		}
		const outcome = objStateVars[key + "_outcome"]
		operation.outcome = outcome;
		operation.committed_outcome = objStateVars[pairKey + "_committed_outcome"];
		operation.initial_outcome = objStateVars[key + "_initial_outcome"];
		operation.staked_on_outcome = Number(objStateVars[key + "_total_staked_on_" + outcome]);
		operation.staked_on_opposite = Number(objStateVars[key + "_total_staked_on_" + (outcome == "in" ? "out" :"in") ]);
		operation.countdown_start= objStateVars[key + "_countdown_start"];
		operation.total_staked = Number(objStateVars[key + "_total_staked"]);
		operation.key = key;
		operation.staked_by_address = assocStakedByKeyAndAddress[key];
		operation.url_proofs_by_outcome = assocProofsByKeyAndOutcome[key]

		operations.push(operation);
		if(!assocOperationsByExchange[operation.exchange])
			assocOperationsByExchange[operation.exchange] = [];
		assocOperationsByExchange[operation.exchange].push(operation);
	});

	currentOperations = operations;
	assocCurrentExchangeByWalletId = assocExchangeByWalletId;
	assocCurrentOperationsByExchange = assocOperationsByExchange;
	exchanges.setWalletIdsByExchange(assocWalletIdsByExchange);;

}


function extractProofUrls(objStateVars){
	assocProofsByKeyAndOutcome= {};
	for (var key in objStateVars){
		if (key.indexOf("k_") == 0){
		var splitKey = key.split('_');
		 if (splitKey[3] == "url" && splitKey[4] == "proof"){
			var outcome = splitKey[6];
			var operation_key = splitKey[0] + '_' + splitKey[1] + '_' + splitKey[2];
			if (!assocProofsByKeyAndOutcome[operation_key])
				assocProofsByKeyAndOutcome[operation_key] = {};
			if(!assocProofsByKeyAndOutcome[operation_key][outcome])
				assocProofsByKeyAndOutcome[operation_key][outcome] = [];
			assocProofsByKeyAndOutcome[operation_key][outcome].push(objStateVars[key]);
		 }
		}
	}

}

function extractStakedByKeyAndAddress(objStateVars){
	assocStakedByKeyAndAddress = {};
	for (var key in objStateVars){
		if (key.indexOf("k_") == 0){
		var splitKey = key.split('_');
		 if (splitKey[3] == "total" && splitKey[7] == "by"){
			var address = splitKey[8];
			var outcome = splitKey[6];
			var operation_key = splitKey[0] + '_' + splitKey[1] + '_' + splitKey[2];
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
		 if (key.indexOf("k_") == 0){
			var splitKey = key.split('_');
			assocOperationKeys[splitKey[0] + '_' + splitKey[1] + '_' + splitKey[2]] = true;
		 }
	 }
	 const operationKeys = [];
	 for (var key in assocOperationKeys){
		operationKeys.push(key);
	 }
	 return operationKeys;
 }


function convertOperationKeyToPairKey(operationKey){
	operationKey = "p" + operationKey.substring(1);
	return 	operationKey.slice(0, 46)
}


function extractPairKeys(objStateVars){
 const assocPairKeys = {};
	for (var key in objStateVars){
		if (key.indexOf("p_") == 0){
			assocPairKeys[key.slice(0, 46)] = true;
		}
	}

	const pairKeys = [];
	for (var key in assocPairKeys){
		pairKeys.push(key);
	}
	return pairKeys;
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
 

 function getCurrentPools(){
	return currentPools;
 }

 function getCurrentOperations(){
	return currentOperations;
}

function getCurrentOperationsForExchange(exchange){
	return assocCurrentOperationsByExchange[exchange] || [];
}

function getCurrentExchangeByWalletId(wallet_id){
	return assocCurrentExchangeByWalletId[wallet_id];
}

function getBestPoolForExchange(exchange){
	var bestPool = {
		reward_amount: 0
	};
	for (var key in assocCurrentPoolsByExchange[exchange]){
		console.log(assocCurrentPoolsByExchange[exchange][key]);
		if (assocCurrentPoolsByExchange[exchange][key].reward_amount > bestPool.reward_amount)
		bestPool = assocCurrentPoolsByExchange[exchange][key];
	}

	for (var key in assocCurrentPoolsByExchange["any"]){
		console.log(assocCurrentPoolsByExchange["any"][key]);
		if (assocCurrentPoolsByExchange["any"][key].reward_amount > bestPool.reward_amount)
		bestPool = assocCurrentPoolsByExchange["any"][key];
	}
	return bestPool;
}

function getLastTransactionsToAA(handle){

	db.query("SELECT is_stable,payload,units.unit,timestamp FROM units INNER JOIN outputs USING(unit) INNER JOIN messages USING(unit) WHERE outputs.address=? ORDER BY main_chain_index ASC",[conf.aa_address],
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

 

 exports.getCurrentPools = getCurrentPools;
 exports.getCurrentOperations = getCurrentOperations;
 exports.getCurrentOperationsForExchange = getCurrentOperationsForExchange;
 exports.getBestPoolForExchange = getBestPoolForExchange;
 exports.getCurrentExchangeByWalletId = getCurrentExchangeByWalletId;
 exports.getLastTransactionsToAA = getLastTransactionsToAA;