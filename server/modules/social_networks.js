var Twitter = require('twitter');
const Discord = require('discord.js');
const conf = require('ocore/conf.js');
const discordChannels = process.env.testnet ? ["645454213643501589"] : [];

var discordClient = null;
var twitterClient = null;

enableDiscord();
if (!process.env.testnet)
	enableTwitter();

function enableTwitter(){
	if (!conf.consumer_key)
		return console.log("twitter consumer_key missing in conf");
	if (!conf.consumer_secret)
		return console.log("twitter consumer_secret missing in conf");
	if (!conf.access_token_key)
		return console.log("twitter access_token_key missing in conf");
	if (!conf.access_token_secret)
		return console.log("twitter access_token_secret missing in conf");
	twitterClient = new Twitter({
		consumer_key: conf.consumer_key,
		consumer_secret: conf.consumer_secret,
		access_token_key: conf.access_token_key,
		access_token_secret: conf.access_token_secret
	});
}


async function enableDiscord(){
	if (!conf.discord_token)
		return console.log("discord_token missing in conf");
	discordClient = new Discord.Client();
	discordClient.on('ready', () => {
		console.log(`Logged in Discord as ${discordClient.user.tag}!`);
	});
	discordClient.on('error', (error) => {
		console.log(`Discord error: ${error}`);
	});
	await discordClient.login(conf.discord_token);
}

function sendToDiscord(text){
	if (!discordClient)
		return console.log("discord client not initialized");
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
		return console.log("twitter client not initialized");
	twitterClient.post('statuses/update', {status: text}, function(error, tweet, response) {
		console.log(error);
		if (error) {
			console.log(error);
		}
	});
}

function notify(objEvent, operation){
	if (!operation)
		return console.log("cannot notify, no operation");

	if (objEvent.event_type == "initial_stake"){
		if (operation.initial_outcome == 'in')
			var message = "New operation initiated by " + objEvent.concerned_address_nickname + ": Add wallet " + operation.wallet_id + " to exchange #" + operation.exchange+"?";
		else
			var message = "New operation initiated by " + objEvent.concerned_address_nickname  + ": Remove wallet " + operation.wallet_id + " from exchange #" + operation.exchange+"?";

	} else if (objEvent.event_type == "stake"){
		if (operation.initial_outcome == 'in' && objEvent.event_data.proposed_outcome != 'in')
			var message = "Counterstake! " + objEvent.concerned_address_nickname + " staked " + displayInGb(objEvent.paid_in) + " for not adding wallet " + operation.wallet_id + " to exchange #" + operation.exchange;
		else if (operation.initial_outcome == 'out' && objEvent.event_data.proposed_outcome != 'out')
			var message = "Counterstake! " + objEvent.concerned_address_nickname + " staked " + displayInGb(objEvent.paid_in) + " for not removing wallet " + operation.wallet_id + " from exchange #" + operation.exchange;
			if (operation.initial_outcome == 'in' && objEvent.event_data.proposed_outcome == 'in')
			var message = "Counterstake! " + objEvent.concerned_address_nickname + " staked " + displayInGb(objEvent.paid_in) + " for adding wallet" + operation.wallet_id + " to exchange #" + operation.exchange;
		else if (operation.initial_outcome == 'out' && objEvent.event_data.proposed_outcome == 'out')
			var message = "Counterstake! " + objEvent.concerned_address_nickname + " staked " + displayInGb(objEvent.paid_in) + " for removing wallet" + operation.wallet_id + " from exchange #" + operation.exchange;
	} else if (objEvent.event_type == "commit"){
		if (operation.initial_outcome == 'in' && objEvent.event_data.committed_outcome == 'in')
			var message = "Wallet " + operation.wallet_id + " is now added to exchange #" + operation.exchange;
		else if (operation.initial_outcome == 'out' && objEvent.event_data.committed_outcome == 'out')
			var message = "Wallet " + operation.wallet_id + " is removed from exchange #" + operation.exchange;
	}
	console.log(message);
	if (message) {
		sendTweet(message);
		sendToDiscord(message);
	}
}

function displayInGb(amount){
	return (amount/1000000000).toPrecision(4) + " GB";
}


exports.sendTweet = sendTweet;
exports.sendToDiscord = sendToDiscord;
exports.notify = notify;