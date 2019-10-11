
const request = require('request');


function getExchangeInfo(exchange_id, try_count){
	return new Promise(function(resolve){
		setTimeout(call, 800);
		function call(){
			if (!try_count)
				try_count = 1;
			if (try_count > 3)
				return resolve(null);
			request({
				url: "https://api.coingecko.com/api/v3/exchanges/" + exchange_id
			},
			function(error, response, body) {

				if (error || response.statusCode !== 200){
					console.error("coingecko request error " + error);
					return getExchangeInfo(exchange_id, try_count+1).then(resolve);
				}
				try {
					var objInfo = JSON.parse(body);
				} catch (e) {
					console.error("coingecko parsing error " + e);
					return getExchangeInfo(exchange_id, try_count+1).then(resolve);
				}
				return resolve(objInfo);
			})
		}
	});
}


exports.getExchangeInfo = getExchangeInfo;