<template>
	

	<b-modal id="editWallet" :okDisabled="isOkDisabled" :title="getTitle" @ok="handleOk">
		<b-container fluid >
			<b-row >
				<b-col cols="8" >
				<b-form-input v-on:input="reset" type='number'  no-wheel v-model="wallet" placeholder="Enter wallet id"  ></b-form-input>
				</b-col>
				<b-col cols="2" >
				<b-button v-if="wallet>0 && !isSpinnerActive && isCheckButtonActive" v-on:click="check" size="s" v>check</b-button>
						<div v-if="isSpinnerActive" class="text-center w-100">
					<b-spinner label="Spinning"></b-spinner>
				</div>
				</b-col>
			</b-row >
			<b-row >
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
	props: ['remove', 'prop_exchange', 'prop_wallet_id'],
	data(){
		return {
			text_error: null,
			wallet: this.prop_wallet_id,
			exchange: this.prop_exchange,
			isOperationAllowed: false,
			isCheckButtonActive: true,
			isSpinnerActive: false,
			isOkDisabled: true,
			rewardAmount: false,
			stakeAmount: conf.challenge_min_stake

		}
	},
	watch:{
		prop_exchange:function(){

			this.reset();
			this.exchange = this.prop_exchange;
		},
		prop_wallet_id:function(){
			this.wallet = this.prop_wallet_id;
			this.reset();
		}


	},
	computed:{
		getTitle:function(){
			if (this.wallet && this.exchange)
				return (this.remove ? "Remove wallet "+ this.wallet + " from exchange " + this.exchange :  "Add wallet "+ this.wallet + " to exchange " + this.exchange)
			else if (this.exchange)
				return (this.remove ? "Remove wallet from exchange ": "Add wallet to exchange" + " " + this.exchange);
			else if (this.wallet)
				return (this.remove ? "Remove wallet "+ this.wallet + " from an exchange ":  "Add wallet "+ this.wallet + " to an exchange ");
			else
				return "";
		}


	},
	methods:{
		reset(){
			this.isSpinnerActive = false;
			this.isCheckButtonActive = true;
			this.text_error = null;
			this.isOkDisabled = true;
			this.bestPoolId = false;
			this.rewardAmount = 0;

		},
		check(){
			this.text_error = null;
			this.isOkDisabled = true;
			this.bestPoolId = false;
			this.rewardAmount = 0;
			this.isSpinnerActive = true;
			this.isCheckButtonActive = false;
			this.wallet = Math.round(this.wallet);

			this.axios.get('/api/getredirection/'+this.wallet).then((response) => {
				console.log(response.data);
				this.wallet = response.data.redirected_id;

				this.axios.get('/api/challenges/'+this.exchange).then((response) => {
					console.log(JSON.stringify(response.data));
					const challenges = response.data;
					var bFound = false;
					for (var i=0; i< challenges.length; i++){
						if (challenges[i].wallet_id != this.wallet || challenges[i].exchange != this.exchange)
							continue;
						bFound = true;
						if (challenges[i].committed_outcome == "in" && !this.remove){
							this.text_error = this.wallet + " already belongs to " + this.exchange;
							break;
						}
						if ((!challenges[i].committed_outcome || challenges[i].committed_outcome == "out") && this.remove){
							this.text_error = this.wallet + " doesn't belong to " + this.exchange;
							break;
						}
						if (challenges[i].status == "onreview")
							this.text_error = "An operation is already ongoing for wallet " + this.wallet + " and exchange " + this.exchange;
					}

						if(!bFound && this.remove)
							this.text_error = this.wallet + " doesn't belong to " + this.exchange;

						if (!this.text_error) {

						this.axios.get('/api/pool/'+this.exchange).then((response) => {
								console.log(JSON.stringify(response.data));
							if (response.data.pool_id){
								this.bestPoolId = response.data.pool_id;
								this.rewardAmount = response.data.reward_amount;
								this.isOkDisabled = false;
							} else {
								this.text_error ="No reward available for operation on this exchange."
							}
								this.isSpinnerActive = false;

						});

				//	this.wallet = response.data.redirected_id;

				} else {
							this.isSpinnerActive = false;

				}

				});
			});
		},
		handleOk(){
			console.log("ok");
				const base64url = require('base64url');
				const data = {
						exchange: this.exchange,
						pool_id: this.bestPoolId
				};

				if (this.remove)
					data.remove_wallet_id = this.wallet;
				else
					data.add_wallet_id = this.wallet;

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