const conf = require('ocore/conf.js');
const light_wallet = require('ocore/light_wallet.js');
const myWitnesses = require('ocore/my_witnesses.js');

const network = require('ocore/network.js');
const db = require('ocore/db.js');

const exchanges = require('./exchanges.js')

var currentPools = [];
var assocCurrentPoolsByExchange = {};

var currentChallenges = [];
var assocCurrentChallengesByExchange = {};

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

		indexChallenges(objStateVars);
		indexRewardPools(objStateVars);
		console.error("currentPools");
		console.error(JSON.stringify(currentPools));
		console.error("currentChallenges");
		console.error(JSON.stringify(currentChallenges));
		
		console.error("assocCurrentPoolsByExchange");
		console.error(JSON.stringify(assocCurrentPoolsByExchange));
		console.error("assocCurrentChallengesByExchange");
		console.error(JSON.stringify(assocCurrentChallengesByExchange));
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

function indexChallenges(objStateVars){

	const challengeKeys = extractChallengeKeys(objStateVars);
	const challenges = [];
	const assocChallengesByExchange = {};
	const assocWalletIdsByExchange = {};

	challengeKeys.forEach(function(key){

		const challenge = {};
		challenge.status = objStateVars[key];
		const pairKey = convertChallengeKeyToPairKey(key)
		const exchange = objStateVars[pairKey + "_exchange"];
		const wallet_id = objStateVars[pairKey + "_wallet_id"];
		challenge.exchange = exchange;
		challenge.wallet_id = wallet_id;

		if(!assocWalletIdsByExchange[exchange])
			assocWalletIdsByExchange[exchange] = [];
		if (objStateVars[pairKey + "_committed_outcome"] == "in")
			assocWalletIdsByExchange[exchange].push(wallet_id);

	//	if (challenge.status == "onreview"){
			const outcome = objStateVars[key+ "_outcome"]
			challenge.outcome = outcome;
			challenge.committed_outcome = objStateVars[pairKey + "_committed_outcome"];
			challenge.initial_outcome = objStateVars[key + "_initial_outcome"];
			challenge.staked_on_outcome = objStateVars[key + "_total_staked_on_" + outcome];
			challenge.staked_on_opposite = objStateVars[key + "_total_staked_on_" + (outcome == "in" ? "out" :"in") ];
			challenge.countdown_start= objStateVars[key + "_countdown_start"];
			challenge.total_staked = objStateVars[key + "_total_staked"];

	//	}

		challenges.push(challenge);
		if(!assocChallengesByExchange[challenge.exchange])
			assocChallengesByExchange[challenge.exchange] = [];
		assocChallengesByExchange[challenge.exchange].push(challenge);
	});

	currentChallenges = challenges;
	assocCurrentChallengesByExchange = assocChallengesByExchange;
	exchanges.setWalletIdsByExchange(assocWalletIdsByExchange);;

}



function extractChallengeKeys(objStateVars){
	const assocChallengeKeys = {};
	 for (var key in objStateVars){
		 if (key.indexOf("k_") == 0){
			var splitKey = key.split('_');
			assocChallengeKeys[splitKey[0] + '_' + splitKey[1] + '_' + splitKey[2]] = true;
		 }
	 }
	 const challengeKeys = [];
	 for (var key in assocChallengeKeys){
		challengeKeys.push(key);
	 }
	 return challengeKeys;
 }


function convertChallengeKeyToPairKey(challengeKey){
	challengeKey = "p" + challengeKey.substring(1);
	return 	challengeKey.slice(0, 46)
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

 function getCurrentChallenges(){
	return currentChallenges;
}

function getCurrentChallengesForExchange(exchange){
	return assocCurrentChallengesByExchange[exchange] || [];
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
 

 exports.getCurrentPools = getCurrentPools;
 exports.getCurrentChallenges = getCurrentChallenges;
 exports.getCurrentChallengesForExchange = getCurrentChallengesForExchange;
 exports.getBestPoolForExchange = getBestPoolForExchange;