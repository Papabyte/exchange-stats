<template>
	<b-modal 
	id="contestOperation" 
	:title="getTitle" 
	:hide-footer="!!link"
	:okDisabled="isOkDisabled" 
	@close="link=false" 
	@ok="handleOk">
		<b-container v-if="!link" fluid >
			<b-row class="pt-3" >
				<label for="range-1">{{$t("contestModalAmountToStake")}}</label>
				<b-form-input id="range-1" 
				v-model="stakeAmountGb" 
				type="range" 
				:number="true" 
				:min="conf.challenge_min_stake_gb" 
				:max="reversalStakeGb*1.01" 
				:step="reversalStakeGb/100"></b-form-input>
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
						<byte-amount :amount="amountLeftToReverse" />
					</template>
					<template #gain_amount>
						<byte-amount :amount="potentialGainAmount" /> 
					</template>
				</i18n>
			</div>
			</b-row >
			<b-row>
				<div class="mt-4">
					{{$t('contestModalProofExplanation')}}
				</div>
				<url-inputs @urls_updated="urls_updated" />
			</b-row >
		</b-container>
		<b-container v-else fluid >
			<b-row class="pt-3">
				{{$t("contestModalLinkHeader")}}
			</b-row >
		<b-row class="pt-3">
			<span class="text-break">
				<a :href="link">{{link}}</a>
			</span>
			</b-row >
			<b-row class="py-3">
				{{$t("contestModalLinkFooter")}}
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
			conf: conf,
			reversalStakeGb:0,
			reversalStake: 0,
			stakeAmountGb: 0,
			stakeAmount: 0,
			isOkDisabled: false,
			link: false,
			urls: [],
			operation_item:{}
		}
	},
	computed:{
		getTitle:function(){
			if (this.operation_item.isRemovingOperation)
				return this.$t("contestModalTitleRemoving", {wallet: this.operation_item.wallet_id, exchange: this.operation_item.exchange});
			else
				return this.$t("contestModalTitleAdding", {wallet: this.operation_item.wallet_id, exchange: this.operation_item.exchange});
		},

		amountLeftToReverse: function(){
			return ((this.reversalStake - this.stakeAmount) );
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
			this.reversalStake = (conf.challenge_coeff*this.operation_item.staked_on_outcome - this.operation_item.staked_on_opposite);
			this.reversalStakeGb = this.reversalStake/conf.gb_to_bytes;
			this.stakeAmountGb = this.reversalStakeGb;
			this.reset();
		},
		stakeAmountGb: function(){
			if (this.stakeAmountGb > this.reversalStakeGb)
				this.stakeAmountGb = this.reversalStakeGb;
			if (this.stakeAmountGb < conf.challenge_min_stake_gb)
				this.stakeAmountGb = conf.challenge_min_stake_gb;
			this.stakeAmount = this.stakeAmountGb * conf.gb_to_bytes;
		}
	},
	methods:{
		urls_updated(urls, bAreUrlsValid){
			this.urls = urls;
			this.isOkDisabled = !bAreUrlsValid;
		},
		reset(){
			this.text_error = null;
		},
		handleOk(bvModalEvt){
				bvModalEvt.preventDefault()	;
				const base64url = require('base64url');
				const data = {
						exchange: this.operationItem.exchange
				};

				if (this.urls[0])
					data.url_1 = this.urls[0];
				if (this.urls[1])
					data.url_2 = this.urls[1];
				if (this.urls[2])
					data.url_3 = this.urls[2];
				if (this.urls[3])
					data.url_4 = this.urls[3];
				if (this.urls[4])
					data.url_5 = this.urls[4];

				if (this.operationItem.isRemovingOperation)
					data.add_wallet_id = this.operationItem.wallet_id;
				else
					data.remove_wallet_id = this.operationItem.wallet_id;
				const json_string = JSON.stringify(data);
				const base64data = base64url(json_string);
				this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount="
					+Math.round(this.stakeAmountGb*conf.gb_to_bytes)+"&base64data="+base64data;
		}
	}
}
</script>

<style lang='scss' scoped>
</style>