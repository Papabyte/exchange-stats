<template>
	<span>
		<span v-if="label"> {{label}}</span>
		<span v-bind:class="amountClass">{{(amount/1000000000).toPrecision(6)}} GB</span>
	</span>
</template>

<script>

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


