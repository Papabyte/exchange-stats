<template>
	<div class="modal-card" id="donateReward" @close="link=false">
		<header class="modal-card-head">
			<p class="modal-card-title">{{ getTitle }}</p>
			<button class="delete" aria-label="close" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="container" v-show="!link">
				<div class="row">
						<b-field :label="$t('contestModalAmountToStake')">
						<b-slider type="is-info" 
						v-model="stakeAmountGb" 
						:min="min_stake_gb" 
						:max="reversalStakeGb" 
						:step="0.00000001"
						class="px-1"
						></b-slider>
					</b-field>
				</div >
				<div class="row">
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
					<div class="row" v-if="amountLeftToReverse>0">
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
					</div>
				</div>
				<div class="row" >
					<div class="mt-4">
						{{$t('contestModalProofExplanation')}}
					</div>
					<url-inputs @urls_updated="urls_updated" class="mt-1"/>
				</div>
							<b-collapse class="card mt-1" :open="false" aria-id="contentIdForA11y3">
				<div
						slot="trigger" 
						slot-scope="props"
						class="card-header"
						role="button"
						aria-controls="contentIdForA11y3">
						<p class="card-header-title">
							Operation history
						</p>
						<a class="card-header-icon">
							<b-icon
								:icon="props.open ? 'menu-down' : 'menu-up'">
							</b-icon>
						</a>
				</div>
				<div class="card-content">
					<div v-if="operationItem" class="content">
						<operation-history :propOperationId="operationItem.operation_id" showTitle/>
					</div>
				</div>
			</b-collapse>
			</div>
			<div class="container" v-if="link" fluid>
				<div class="pt-3">
					{{$t('editModalLinkHeader')}}
				</div>
				<div class="pt-3">
					<wallet-link :link="link" />
				</div>
				<div class="py-3 test">
					{{$t('editModalLinkFooter')}}
				</div>
			</div>

		</section>
		<footer class="modal-card-foot f-end">
			<button class="button is-primary" v-if="link" @click="link=null">{{$t('commonButtonBack')}}</button>
			<button class="button" type="button" @click="$parent.close()">{{$t('commonButtonClose')}}</button>
			<button class="button is-primary" v-if="!link" :disabled="isOkDisabled" @click="handleOk">{{$t('commonButtonOk')}}</button>
		</footer>
	</div>
</template>

<script>
const conf = require("../../conf.js");
import ByteAmount from './ByteAmount.vue';
import UrlInputs from './UrlInputs.vue';
import WalletLink from './WalletLink.vue'
import OperationHistory from './OperationHistory.vue';

export default {	
	components: {
		ByteAmount,
		UrlInputs,
		WalletLink,
		OperationHistory
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
			min_stake_gb: 10001/conf.gb_to_bytes,
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
	created(){
			this.operation_item = this.operationItem;
			this.operation_item.isRemovingOperation = this.operation_item.outcome == 'out'
			this.reversalStake = (conf.challenge_coeff*this.operation_item.staked_on_outcome - this.operation_item.staked_on_opposite);
			this.reversalStakeGb = this.reversalStake/conf.gb_to_bytes;
			this.stakeAmountGb = this.reversalStakeGb;

	},
	computed:{
		getTitle:function(){
			if (this.operation_item.initial_outcome == 'in' && this.operation_item.outcome == 'in')
				return this.$t("contestModalTitleContestAdding", {wallet: this.operation_item.wallet_id, exchange: this.operation_item.exchange});
			else if (this.operation_item.initial_outcome == 'out' && this.operation_item.outcome == 'out')
				return this.$t("contestModalTitleContestRemoving", {wallet: this.operation_item.wallet_id, exchange: this.operation_item.exchange});
			else if (this.operation_item.initial_outcome == 'in' && this.operation_item.outcome == 'out')
				return this.$t("contestModalTitleConfirmAdding", {wallet: this.operation_item.wallet_id, exchange: this.operation_item.exchange});
			else if (this.operation_item.initial_outcome == 'out' && this.operation_item.outcome == 'in')
				return this.$t("contestModalTitleConfirmRemoving", {wallet: this.operation_item.wallet_id, exchange: this.operation_item.exchange});
		},
		amountLeftToReverse: function(){
			return this.reversalStake - this.stakeAmount;
		},
		potentialGainAmount: function(){
			return this.stakeAmount / conf.challenge_coeff;
		},

	},
	watch:{
		stakeAmountGb: function(){
			if (this.stakeAmountGb > this.reversalStakeGb)
				this.stakeAmountGb = this.reversalStakeGb;
			if (this.stakeAmountGb < this.min_stake_gb)
				this.stakeAmountGb =  this.min_stake_gb;
			this.stakeAmount = this.stakeAmountGb * conf.gb_to_bytes;
		}
	},
	methods:{
		urls_updated(urls, bAreUrlsValid){
			this.urls = urls;
			this.isOkDisabled = !bAreUrlsValid;
		},
		handleOk(bvModalEvt){
				bvModalEvt.preventDefault()	;
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
				const base64data = encodeURIComponent(btoa(json_string));
				this.link = conf.protocol+":"+conf.aa_address+"?amount="
					+Math.round(this.stakeAmountGb*conf.gb_to_bytes)+"&base64data="+base64data;
		}
	}
}
</script>

<style lang='scss' scoped>
</style>