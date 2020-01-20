const conf = require('../conf.js')

export default {
	methods: {
		getByteAmountString: function(amount){
			return (amount/gb_to_bytes >=1 ? ((amount/conf.gb_to_bytes).toPrecision(6)/1).toLocaleString(): ((amount/conf.gb_to_bytes).toPrecision(6)/1)) + 'GB'
		}
	}
}