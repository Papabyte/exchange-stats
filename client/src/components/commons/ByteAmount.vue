<template>
	<span>
		<span v-if="label"> {{label}}</span>
		<span v-bind:class="amountClass">{{(amount/gb_to_bytes).toPrecision(6)}} GB</span>
	</span>
</template>

<script>
const conf = require("../../conf.js");

export default {
	props: {
		amount: {
			type: Number,
			required: true
		},
		label: {
			type: String,
			required: false
		},
		isNegative: {
			type: Boolean,
			required: false,
			default: false
		},
		isPositive: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	data(){
		return {
			gb_to_bytes: conf.gb_to_bytes
		}
	},
	computed:{
		amountClass:function(){
			return {
				negative: this.isNegative,
				positive: this.isPositive,
				default: !this.isNegative && !this.isPositive
			};
		}
	}
}
</script>

<style lang='scss' scoped>
	.negative{
		color: red;

	}

	.positive{
		color: green;

	}

	.default{

	}
</style>


