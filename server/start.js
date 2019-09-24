/*const express = require('express')
const ocore = require('ocore');
const conf = require('ocore/conf.js');

const app = express()

app.get('/post', function(request, response){
	if (typeof request != 'object' || typeof request.body != 'object')
		return response.send({ error: "bad request" });
	else
		treatIncomingRequest(request.body, function(objResponse){
				return response.send(objResponse);
		});
});
app.listen(conf.api_port);*/

const fs = require('fs');

const exchanges = require('./exchanges.json');

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