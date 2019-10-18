<template>
	<b-modal 
		id="editWallet" 
		:okDisabled="isOkDisabled" 
		@close="link=false" 
		:hide-footer="!!link" 
		:title="getTitle"
		@ok="handleOk">
		<b-container v-if="!link" fluid >

			<b-row v-if="!propExchange">
				<label for="input-with-list">{{$t("editModalSelectExchange")}}</label>
				<b-form-input 
					v-on:input="reset" 
					:state="validExchange"
					list="input-list"
					v-model="exchange"
					id="input-with-list"
					></b-form-input>
				<b-form-datalist 
					id="input-list"
					:options="assocExchanges"></b-form-datalist>
				<b-button 
					variant="primary"
					v-if="validExchange"
					v-on:click="getBestPool"
					size="s">check</b-button>
			</b-row >

			<b-row v-if="!prop_wallet_id && !isRemoving">
				<b-col cols="9" >
				<b-form-input
					v-on:input="reset"
					type='text'
					no-wheel
					v-model="wallet"
					:placeholder="$t('editModalHolderEnterIdOrAddress')"></b-form-input>
				</b-col>
				<b-col cols="2" >
				<b-button
					variant="primary"
					v-if="!isSpinnerActive && isCheckButtonActive"
					v-on:click="check" 
					size="s">check</b-button>
						<div v-if="isSpinnerActive" class="text-center w-100">
						<b-spinner label="Spinning"></b-spinner>
				</div>
				</b-col>
			</b-row >

			<b-row v-if="!prop_wallet_id && isRemoving">
				<div>
					<b-form-group label="Select wallet to be removed" >
						<b-form-radio  v-for="wallet_id in wallet_choices" name="some-radios" :value="wallet_id" :key="wallet_id" @change="onRadioSelected">{{wallet_id}} </b-form-radio>
					</b-form-group>
				</div>
			</b-row >


			<b-row >
				<span v-if="text_error" class="pt-3">{{text_error}}</span>
				<div v-if="rewardAmount>0" class="pt-3">
					<i18n v-if="isRemoving" path="editModalGainIfRemoved" id="potential-gain">
						<template #stake_amount>
							<byte-amount :amount="stakeAmount" />
						</template>
						<template #gain_amount>
							<byte-amount :amount="rewardAmount" /> 
						</template>
						<template #wallet>
							{{wallet}}
						</template>
						<template #exchange>
							<exchange :id="exchange" noUrl />
						</template>
					</i18n>
					<i18n v-else path="editModalGainIfAdded" id="potential-gain">
						<template #stake_amount>
							<byte-amount :amount="stakeAmount" />
						</template>
						<template #gain_amount>
							<byte-amount :amount="rewardAmount" /> 
						</template>
						<template #wallet>
							{{wallet}}
						</template>
						<template #exchange>
							<exchange :id="exchange" noUrl />
						</template>
  			</i18n>
				<UrlInputs v-on:url_1_update="update_url_1" v-on:url_2_update="update_url_2"/>
				</div>
			</b-row >

		</b-container>
		<b-container v-else fluid >
			<b-row class="pt-3">
				{{$t("editModalLinkHeader")}}
			</b-row >
			<b-row class="pt-3">
				<span class="text-break">
					<a :href="link">{{link}}</a>
				</span>
			</b-row >
			<b-row class="py-3">
				{{$t("editModalLinkFooter")}}
			</b-row >
		</b-container>
	</b-modal>
</template>

<script>
const conf = require("../../conf.js");
import ByteAmount from './ByteAmount.vue';
import Exchange from './Exchange.vue';
import UrlInputs from './UrlInputs.vue';
import validate from 'bitcoin-address-validation';

export default {	
	components: {
		ByteAmount,
		UrlInputs,
		Exchange
	},
	props: {
		prop_wallet_id: {
			type: Number,
			required: false,
			default: null
		},
		propExchange: {
			type: String,
			required: false,
			default: null
		},
		isRemoving: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	data(){
		return {
			text_error: null,
			wallet: null,
			wallet_choices: [],
			exchange: null,
			isOperationAllowed: false,
			isSpinnerActive: false,
			isOkDisabled: true,
			rewardAmount: false,
			isCheckButtonActive: false,
			stakeAmount: conf.challenge_min_stake,
			link: false,
			url_1: null,
			url_2: null
			}
	},

	computed:{

		getTitle:function(){
			if (this.propExchange){
				if (this.wallet && this.exchange){
					return (this.isRemoving ? this.$t('editModalRemoveXFromX', {exchange: this.assocExchanges[this.exchange], wallet: this.wallet}): 
					this.$t('editModalAddXToX', {exchange:this.assocExchanges[this.exchange], wallet: this.isWalletId(this.wallet)? this.wallet : ""}));
				}
				else if (this.exchange){
					return (this.isRemoving ? this.$t('editModalRemoveFromX',{exchange:this.assocExchanges[this.exchange]}):
					this.$t('editModalAddToX',{exchange:this.assocExchanges[this.exchange]}));
				}
				else if (this.wallet){
					return (this.isRemoving ? this.$t('editModalRemoveXFrom', {wallet: this.wallet}): 
					this.$t('editModalAddXTo', {wallet: this.isWalletId(this.wallet) ? this.wallet : ""}));
				}
			} else if (this.prop_wallet_id){
					return this.$t('editModalAddXToX', {exchange:this.assocExchanges[this.exchange], wallet: this.isWalletId(this.wallet) ? this.wallet : ""});
			 } else
				 return "";
		},
		validExchange() {
			return !!this.assocExchanges[this.exchange]
		},
		assocExchanges() {
			return this.$store.state.exchangesById;
		}
	},
		watch:{
		propExchange:function(){
			this.exchange = this.propExchange;
			this.wallet = this.prop_wallet_id;
			this.reset();
		},
		prop_wallet_id:function(){
			this.wallet = this.prop_wallet_id;
			this.exchange = this.propExchange;

			if (this.propExchange)
				this.check()
			this.reset();
		},
		wallet: function(){
			this.isCheckButtonActive = validate(this.wallet) || this.isWalletId(this.wallet);
		}
	},
	mounted(){
		if (this.prop_wallet_id)
			this.wallet = this.prop_wallet_id;
	},
	methods:{
		isWalletId(wallet){
				return (Number(wallet) && parseInt(wallet))
		},
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
			if (!this.wallet && this.exchange && this.isRemoving){
				this.axios.get('/api/exchange-wallets/'+this.exchange).then((response) => {
					this.wallet_choices = response.data;
				});
			}
		},
		onRadioSelected(arg){
this.wallet = arg;
this.check();

		},
		check(){
			this.text_error = null;
			this.isOkDisabled = true;
			this.bestPoolId = false;
			this.rewardAmount = 0;
			this.isSpinnerActive = true;
			this.isCheckButtonActive = false;

/*			if (){
				return this.text_error = "Invalid wallet id or BTC address";//this.$t("editModalAlreadyBelongs", {wallet: this.wallet, exchange: this.exchange});
			}*/

			this.axios.get('/api/redirection/'+this.wallet).then((response) => {
				this.wallet = response.data.redirected_id;
				this.axios.get('/api/operations/'+this.exchange).then((response) => {
					const operations = response.data;
					var bFound = false;
					for (var i=0; i< operations.length; i++){
						if (operations[i].wallet_id != this.wallet || operations[i].exchange != this.exchange)
							continue;
						bFound = true;
						if (operations[i].committed_outcome == "in" && !this.isRemoving){
							this.text_error = this.$t("editModalAlreadyBelongs", {wallet: this.wallet, exchange: this.exchange});
							break;
						}
						if ((!operations[i].committed_outcome || operations[i].committed_outcome == "out") && this.isRemoving){
							this.text_error = this.$t("editModalDoesntBelong", {wallet: this.wallet, exchange: this.exchange});
							break;
						}
						if (operations[i].status == "onreview")
							this.text_error = this.$t("editModalOperationOnGoing", {wallet: this.wallet, exchange: this.exchange});
					}

						if(!bFound && this.isRemoving)
							this.text_error = this.$t("editModalDoesntBelong", {wallet: this.wallet, exchange: this.exchange});

						if (!this.text_error) {
							this.getBestPool()
						} else {
							this.isSpinnerActive = false;
						}

				});
			});
		},
		getBestPool(){
			this.axios.get('/api/pool/'+this.exchange).then((response) => {
				console.log("pool");
				console.log(response.data);
				if (response.data.pool_id){
					this.bestPoolId = response.data.pool_id;
					this.rewardAmount = Number(response.data.reward_amount);
					this.isOkDisabled = false;
				} else {
					this.text_error = this.$t("editModalNoRewardAvailable");
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