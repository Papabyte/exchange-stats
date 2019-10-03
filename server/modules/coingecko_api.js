
const request = require('request');


function getExchangeInfo(exchange_id, try_count){
	return new Promise(function(resolve){
		if (!try_count)
			try_count = 1;
		if (try_count > 3)
			return resolve(null);
		request({
			url: "https://api.coingecko.com/api/v3/exchanges/" + exchange_id
		},
		function(error, response, body) {

			if (error || response.statusCode !== 200){
				return getExchangeInfo(exchange_id, try_count+1);
			}
			try {
				var objInfo = JSON.parse(body);
			} catch (e) {
				console.error(e);
				return getExchangeInfo(exchange_id, try_count+1);
			}
			return resolve(objInfo);
		})
	});
}


exports.getExchangeInfo = getExchangeInfo;