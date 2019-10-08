<template>
	<div>
		<span v-if="label"> {{label}}</span><span v-bind:class="amountClass">{{amount/100000000}} BTC </span>
	</div>
</template>

<script>

export default {
	props: ['amount', 'label','isNegative','isPositive'],
	  data(){ return {
	

  }},
	computed:{

		amountClass:function(){
					return {
					negative: this.isNegative,
					positive: this.isPositive
				};
		}
/*			if (this.isNegative){
				console.log(this.amount + "negative")
				return "negative";
			}
			if (this.isPositive){
								console.log(this.amount + "positive")

				return "positive";
			}
		}*/

	}
}
</script>

<style lang='scss'>

.negative{
	color: red;
	font-size: 20px;
}

.positive{
	color: green;
	font-size: 20px;

}

</style>
