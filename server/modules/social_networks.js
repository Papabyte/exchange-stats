var Twitter = require('twitter');
const Discord = require('discord.js');

const discordChannels = process.env.testnet ? ["645454213643501589"] : [];

var discordClient = null;
var twitterClient = null;

enableDiscord();
if (!process.env.testnet)
	enableTwitter();

function enableTwitter(){
	twitterClient = new Twitter({
		consumer_key: process.env.consumer_key,
		consumer_secret: process.env.consumer_secret,
		access_token_key: process.env.access_token_key,
		access_token_secret: process.env.access_token_secret
	});
}


async function enableDiscord(){
	discordClient = new Discord.Client();
	await discordClient.login(process.env.discord_token);
}

function sendToDiscord(text){
	discordChannels.forEach(function(channel){
		try {
			discordClient.channels.get(channel).send(text);
		} catch(e) {
			console.log("couldn't get channel " + channel + ", reason: " + e);
		}
	});
}

function sendTweet(text){
	if (!twitterClient)
		return;
	twitterClient.post('statuses/update', {status: text}, function(error, tweet, response) {
		console.log(error);
		if (error) {
			console.log(error);
		}
	});
}

function notify(operation_type, operation, author, objAaResponse){

	if (operation_type == "initial_stake"){
		if (operation.initial_outcome == 'in')
			var message = "New operation initiated by " + author + ": Add wallet " + operation.wallet_id + " to exchange #" + operation.exchange+"?";
		else
			var message = "New operation initiated by " + author  + ": Remove wallet " + operation.wallet_id + " from exchange #" + operation.exchange+"?";

	} else if (operation_type == "stake"){
		if (operation.initial_outcome == 'in' && objAaResponse.proposed_outcome != 'in')
			var message = "Counterstake! " + author + " staked " + displayInGb(objAaResponse.accepted_amount) + " for not adding wallet" + operation.wallet_id + " to exchange #" + operation.exchange;
		else if (operation.initial_outcome == 'out' && objAaResponse.proposed_outcome != 'out')
			var message = "Counterstake! " + author + " staked " + displayInGb(objAaResponse.accepted_amount) + " for not removing wallet" + operation.wallet_id + " from exchange #" + operation.exchange;
			if (operation.initial_outcome == 'in' && objAaResponse.proposed_outcome == 'in')
			var message = "Counterstake! " + author + " staked " + displayInGb(objAaResponse.accepted_amount) + " for adding wallet" + operation.wallet_id + " to exchange #" + operation.exchange;
		else if (operation.initial_outcome == 'out' && objAaResponse.proposed_outcome == 'out')
			var message = "Counterstake! " + author + " staked " + displayInGb(objAaResponse.accepted_amount) + " for removing wallet" + operation.wallet_id + " from exchange #" + operation.exchange;
	} else if (operation_type == "commit"){
		if (operation.initial_outcome == 'in' && objAaResponse.outcome == 'in')
			var message = "Wallet " + operation.wallet_id + "is now added to exchange #" + operation.exchange;
		else if (operation.initial_outcome == 'out' && objAaResponse.outcome == 'out')
			var message = "Wallet " + operation.wallet_id + "is removed from exchange #" + operation.exchange;
	}
	
	sendTweet(message);
	sendToDiscord(message);
}

function displayInGb(amount){
	return (amount/1000000000).toPrecision(4)+ " GB";
}


exports.sendTweet = sendTweet;
exports.sendToDiscord = sendToDiscord;
exports.notify = notify;