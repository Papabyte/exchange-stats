<template>
	<b-modal 
		id="editWallet" 
		:okDisabled="isOkDisabled" 
		@close="link=false" 
		:hide-footer="!!link" 
		:title="getTitle"
		@ok="handleOk">
		<b-container v-if="!link" fluid >
			<b-row v-if="!prop_exchange">
				<label for="input-with-list">Select the exchange to which you want to add wallet</label>
				<b-form-input 
					v-on:input="reset" 
					:state="validExchange"
					list="input-list"
					v-model="exchange"
					id="input-with-list"
					></b-form-input>
				<b-form-datalist 
					id="input-list"
					:options="objExchanges"></b-form-datalist>
				<b-button 
					variant="primary"
					v-if="validExchange"
					v-on:click="getBestPool"
					size="s">check</b-button>
			</b-row >
			<b-row v-if="!prop_wallet_id">
				<b-col cols="8" >
				<b-form-input
					v-on:input="reset"
					type='number'
					no-wheel
					v-model="wallet"
					placeholder="Enter wallet id"></b-form-input>
				</b-col>
				<b-col cols="2" >
				<b-button
					variant="primary"
					v-if="wallet>0 && !isSpinnerActive && isCheckButtonActive"
					v-on:click="check" 
					size="s">check</b-button>
						<div v-if="isSpinnerActive" class="text-center w-100">
						<b-spinner label="Spinning"></b-spinner>
				</div>
				</b-col>
			</b-row >
			<b-row >
				<span v-if="text_error" class="pt-3">{{text_error}}</span>
				<div v-if="rewardAmount>0" class="pt-3">
					Stake <ByteAmount :amount="stakeAmount" />, gain <ByteAmount :amount="rewardAmount" /> if wallet {{wallet}} is successfully {{isRemoving ? "removed from" : "added to"}} exchange {{exchange}}
				<UrlInputs v-on:url_1_update="update_url_1" v-on:url_2_update="update_url_2"/>
				</div>
			</b-row >

		</b-container>
		<b-container v-else fluid >
			<b-row class="pt-3">
				By clicking the link below, your Obyte wallet will open and ready to send a transaction for ordering the operation.
			</b-row >
			<b-row class="pt-3">
				<span class="text-break">
					<a :href="link">{{link}}</a>
				</span>
			</b-row >
			<b-row class="py-3">
				It will be taken into account after a few minutes when the transaction is confirmed. Note that it could be canceled if meanwhile another user ordered a similar operation. In this case, the AA would bounce the transaction to refund you.
			</b-row >
		</b-container>
	</b-modal>
</template>

<script>
const conf = require("../../conf.js");
import ByteAmount from './ByteAmount.vue';
import UrlInputs from './UrlInputs.vue';

export default {	
	components: {
		ByteAmount,
		UrlInputs
	},
	props: ['isRemoving', 'prop_exchange', 'prop_wallet_id'],
	data(){
		return {
			text_error: null,
			wallet: null,
			exchange: null,
			isOperationAllowed: false,
			isCheckButtonActive: true,
			isSpinnerActive: false,
			isOkDisabled: true,
			rewardAmount: false,
			stakeAmount: conf.challenge_min_stake,
			link: false,
			url_1: null,
			url_2: null,
			objExchanges: {}
		}
	},
	watch:{
		prop_exchange:function(){

			this.exchange = this.prop_exchange;
			this.reset();

		},
		prop_wallet_id:function(){
			this.wallet = this.prop_wallet_id;
			if (this.prop_exchange)
				this.check()
			this.reset();
		}


	},
	computed:{
		getTitle:function(){
			if (this.prop_exchange){
			if (this.wallet && this.exchange)
				return (this.isRemoving ? "Remove wallet "+ this.wallet + " from exchange " + this.exchange :  "Add wallet "+ this.wallet + " to exchange " + this.exchange)
			else if (this.exchange)
				return (this.isRemoving ? "Remove wallet from exchange ": "Add wallet to exchange" + " " + this.exchange);
			else if (this.wallet)
				return (this.isRemoving ? "Remove wallet "+ this.wallet + " from an exchange ":  "Add wallet "+ this.wallet + " to an exchange ");
			}
			 if (this.prop_wallet_id){
				return "Add wallet " + this.wallet + " to exchange " + this.exchange;
			 }
			 return "";
		},
		validExchange() {
			return !!this.objExchanges[this.exchange]
		}

	},
	mounted(){
		if (this.prop_wallet_id)
			this.wallet = this.prop_wallet_id;

		this.axios.get('/api/exchanges').then((response) => {
			console.log(response.data);
		response.data.forEach((row)=>{
			this.objExchanges[row.id] = row.name;
			});
		});
	},
	methods:{
		update_url_1(value){
			this.url_1 = value;
		},
		update_url_2(value){
			this.url_2 = value;
		},
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

				this.axios.get('/api/operations/'+this.exchange).then((response) => {
					console.log(JSON.stringify(response.data));
					const operations = response.data;
					var bFound = false;
					for (var i=0; i< operations.length; i++){
						if (operations[i].wallet_id != this.wallet || operations[i].exchange != this.exchange)
							continue;
						bFound = true;
						if (operations[i].committed_outcome == "in" && !this.isRemoving){
							this.text_error = this.wallet + " already belongs to " + this.exchange;
							break;
						}
						if ((!operations[i].committed_outcome || operations[i].committed_outcome == "out") && this.isRemoving){
							this.text_error = this.wallet + " doesn't belong to " + this.exchange;
							break;
						}
						if (operations[i].status == "onreview")
							this.text_error = "An operation is already ongoing for wallet " + this.wallet + " and exchange " + this.exchange;
					}

						if(!bFound && this.isRemoving)
							this.text_error = this.wallet + " doesn't belong to " + this.exchange;

						if (!this.text_error) {
							this.getBestPool()

				//	this.wallet = response.data.redirected_id;

						} else {
									this.isSpinnerActive = false;

						}

				});
			});
		},
		getBestPool(){

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
		},
		handleOk(bvModalEvt){
				bvModalEvt.preventDefault();
				const base64url = require('base64url');
				const data = {
						exchange: this.exchange,
						pool_id: this.bestPoolId
				};

				if (this.url_1)
					data.url_1 = this.url_1;
				if (this.url_2)
					data.url_2 = this.url_2;

				if (this.isRemoving)
					data.remove_wallet_id = this.wallet;
				else
					data.add_wallet_id = this.wallet;

				const json_string = JSON.stringify(data);
				const base64data = base64url(json_string);
				this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount="
					+this.stakeAmount+"&base64data="+base64data;
		}
	}
}
</script>

<style lang='scss' scoped>
</style>