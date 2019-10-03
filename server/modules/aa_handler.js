const conf = require('ocore/conf.js');
const light_wallet = require('ocore/light_wallet.js');
const myWitnesses = require('ocore/my_witnesses.js');

const network = require('ocore/network.js');
const db = require('ocore/db.js');

var currentPools = {};
var currentChallenges = {};

myWitnesses.readMyWitnesses(function (arrWitnesses) {
	if (arrWitnesses.length > 0)
		return start();
	console.log('will init witnesses', conf.initial_witnesses);
	myWitnesses.insertWitnesses(conf.initial_witnesses, start);
}, 'ignore');


function start(){
	light_wallet.setLightVendorHost(conf.hub);

	db.query("INSERT "+db.getIgnore()+" INTO my_watched_addresses (address) VALUES (?)", [conf.aa_address], function(){
			network.addLightWatchedAddress(conf.address);
	});
	network.requestFromLightVendor('light/get_aa_state_vars', {address: conf.aa_address},function(error, request, objStateVars){

		console.error("objStateVars");

		console.error(objStateVars);


	});

}




