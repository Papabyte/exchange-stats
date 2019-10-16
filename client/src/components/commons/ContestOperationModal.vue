<template>
	<b-modal id="contestOperation" :title="getTitle" :hide-footer="!!link" @close="link=false" @ok="handleOk">
		<b-container v-if="!link" fluid >
			<b-row class="pt-3" >
				<label for="range-1">{{$("contestModalAmountToStake")}}</label>
				<b-form-input id="range-1" v-model="stakeAmountGb" type="range" :number="true" min="0.001" :max="reversalStakeGb" :step="reversalStakeGb/100"></b-form-input>
			</b-row >
			<b-row>
				<span v-if="text_error" class="pt-3">{{text_error}}</span>
				<div class="pt-3">
					<i18n path="contestModalGainIfReversed" id="potential-gain">
						<template #stake_amount>
							<byte-amount :amount="stakeAmount" />
						</template>
						<template #gain_amount>
							<byte-amount :amount="potentialGainAmount" /> 
						</template>
					</i18n>
				</div>
			</b-row >
			<b-row v-if="amountLeftToReverse>0">
			<div class="pt-3">
				<i18n path="contestModalAmountLeft" id="amount-left">
					<template #amount>
						<byte-amount :amount="amountLeftToReverse" /> l
					</template>
					<template #gain_amount>
						<byte-amount :amount="potentialGainAmount" /> 
					</template>
				</i18n>
			</div>
			</b-row >
			<b-row>
				<UrlInputs v-on:url_1_update="update_url_1" v-on:url_2_update="update_url_2"/>
			</b-row >
		</b-container>
		<b-container v-else fluid >
			<b-row class="pt-3">
				{{$("contestModalLinkHeader")}}
			</b-row >
		<b-row class="pt-3">
			<span class="text-break">
				<a :href="link">{{link}}</a>
			</span>
			</b-row >
			<b-row class="py-3">
				{{$("contestModalLinkFooter")}}
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
	props: {
		operationItem: {
			type: Object,
			required: false,
			default:  function () {
				return {}
			}
		}
	},
	data(){
		return {
			text_error: null,
			isOperationAllowed: false,
			isCheckButtonActive: true,
			isSpinnerActive: false,
			coeff: conf.coef_challenge,
			reversalStakeGb:0,
			reversalStake: 0,
			stakeAmountGb: 0,
			stakeAmount: 0,
			link: false,
			url_1: null,
			url_2: null,
			operation_item:{}
			
		}
	},
	computed:{
		getTitle:function(){
			if (this.operation_item.isRemovingOperation)
				return this.$("contestModalTitleRemoving", {wallet: this.operation_item.wallet_id, exchange: this.operation_item.exchange});
			else
				return this.$("contestModalTitleAdding", {wallet: this.operation_item.wallet_id, exchange: this.operation_item.exchange});
		},

		amountLeftToReverse: function(){
			return ((this.reversalStakeGb - this.stakeAmount) );
		},
		newTotalOppositeStakeForReversal: function(){
			return this.reversalStake + (this.operation_item.total_staked - this.operation_item.staked_on_outcome);
		},
		newTotalStake: function(){
			return this.operation_item.total_staked + this.stakeAmount;
		},
		potentialGainAmount: function(){
			return this.stakeAmount / this.newTotalOppositeStakeForReversal *  this.newTotalStake - this.stakeAmount;
		}
	},
	watch:{
		operationItem:function(){
			if(!this.operationItem)
				return;
			this.operation_item = this.operationItem;
			this.reversalStake = (conf.challenge_coef*this.operation_item.staked_on_outcome+1001);
			this.reversalStakeGb = this.reversalStake/1000000000;
			this.stakeAmountGb = this.reversalStakeGb;
			this.reset();
		},
		stakeAmountGb: function(){
			this.stakeAmount = this.stakeAmountGb * 1000000000;
		}
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
			this.bestPoolId = false;
			this.rewardAmount = 0;
		},
		handleOk(bvModalEvt){
				bvModalEvt.preventDefault()	;
				const base64url = require('base64url');
				const data = {
						exchange: this.operationItem.exchange
				};
				if (this.url_1)
					data.url_1 = this.url_1;
				if (this.url_2)
					data.url_2 = this.url_2;

				if (this.operationItem.isRemovingOperation)
					data.add_wallet_id = this.operationItem.wallet_id;
				else
					data.remove_wallet_id = this.operationItem.wallet_id;
				const json_string = JSON.stringify(data);
				const base64data = base64url(json_string);
				this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount="
					+Math.round(this.stakeAmountGb*1000000000)+"&base64data="+base64data;
				window.open(href, '_blank');
		}
	}
}
</script>

<style lang='scss' scoped>
</style>