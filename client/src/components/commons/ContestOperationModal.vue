<template>
	

	<b-modal id="contestOperation" :title="getTitle" @ok="handleOk">
		<b-container fluid >
				<b-row class="pt-3" >
				<label for="range-1">Amount to stake</label>
			<b-form-input id="range-1" v-model="amount" type="range" min="0.000001" :max="maxStake" :step="maxStake/100"></b-form-input>
				<byteAmount :amount="stakeAmount"/>
			</b-row >
			<b-row>
				<span v-if="text_error" class="pt-3">{{text_error}}</span>
				<div v-if="rewardAmount>0" class="pt-3">
					Stake <ByteAmount :amount="stakeAmount" />, gain <ByteAmount :amount="rewardAmount" /> if wallet {{wallet}} is successfully {{remove ? "removed" : "added"}} from exchange {{exchange}}
				</div>
			</b-row >

		</b-container>

	</b-modal>


</template>

<script>
const conf = require("../../conf.js");
import ByteAmount from './ByteAmount.vue';

export default {	
	components: {
		ByteAmount
	},
	props: ['prop_operation_item'],
	data(){
		return {
			text_error: null,
			isOperationAllowed: false,
			isCheckButtonActive: true,
			isSpinnerActive: false,
			rewardAmount: false,
			coeff: conf.coef_challenge,
			maxStake:0,
			amount: 0
		}
	},
	watch:{
		prop_operation_item:function(){
			console.log("watched");
			console.log(this.prop_operation_item.staked_on_outcome);
						console.log(conf.challenge_coef);
			this.maxStake = (conf.challenge_coef*this.prop_operation_item.staked_on_outcome+10000)/1000000000;
			this.amount = this.maxStake;

			this.reset();
		}


	},
	computed:{
		getTitle:function(){
			if (!this.prop_operation_item)
			return "";
			if (this.prop_operation_item.isRemovingOperation)
				return ("Contest removing of wallet "+ this.prop_operation_item.wallet_id + " from exchange " + this.prop_operation_item.exchange);
			else
				return ("Contest adding of wallet "+ this.prop_operation_item.wallet_id + " to exchange " + this.prop_operation_item.exchange);
		},
		stakeAmount:function(){

			return this.amount*1000000000;
		}


	},
	methods:{
		reset(){
			this.isSpinnerActive = false;
			this.isCheckButtonActive = true;
			this.text_error = null;
			this.bestPoolId = false;
			this.rewardAmount = 0;

		},
		check(){

		},
		handleOk(){
			console.log("ok");
				const base64url = require('base64url');
				const data = {
						exchange: this.prop_operation_item.exchange,
				};

				if (this.prop_operation_item.isRemovingOperation)
					data.add_wallet_id = this.prop_operation_item.wallet_id;
				else
					data.remove_wallet_id = this.prop_operation_item.wallet_id;

				const json_string = JSON.stringify(data);
				const base64data = base64url(json_string);
				const href = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount="
					+this.stakeAmount+"&base64data="+base64data;
				window.open(href, '_blank');
		}
	}
}
</script>

<style lang='scss' scoped>
</style>