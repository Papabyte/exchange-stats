<template>
	<b-modal id="donateReward" title="Donate a reward"  :hide-footer="!!link" :okDisabled="!validExchange && !isForAny" @close="link=false" @ok="handleOk">
		<b-container v-if="!link" fluid  >
			<b-row >
				<label for="input-with-list">{{$t("donateModalSelectExchange")}}</label>
				<b-form-input id="input-with-list" list="input-list"  :state="validExchange" :disabled="isForAny" v-model="exchange"></b-form-input>
				<b-form-datalist id="input-list" :options="objExchanges"  ></b-form-datalist>
			</b-row >
			<b-row class="pt-3" >
				<b-form-checkbox
				id="checkbox-1"
				v-model="isForAny"
				@change="exchange =''"
				name="checkbox-1"
				>
				{{$t("donateModalDonateForAny")}}
				</b-form-checkbox>
			</b-row >
			<b-row class="pt-3" >
				<label for="range-1">{{$t("donateModalIndividualRewardAmount")}}</label>
			<b-form-input id="range-1" v-model="amount" type="range" min="0.01" max="10" step="0.01"></b-form-input>
				<byte-amount :amount="amount*gb_to_bytes"/>
			</b-row >
			<b-row class="pt-3" >
				<label for="range-2">{{$t("donateModalNumberOfRewards")}}</label>
				<b-form-input id="range-2"  type="range" min="1" max="10" step="1" v-model="nb_reward"></b-form-input>
				{{nb_reward}}
			</b-row >
			<b-row class="pt-3" >
				<div v-if="validExchange || isForAny" >
					<i18n v-if="!isForAny" path="donateModalDonateAmountFor" tag="label" id="donate-amount">
						<template #amount>
							<byte-amount :amount="Math.round(nb_reward*amount*gb_to_bytes)"/> 
						</template>
						<template #exchange>
							<exchange :id="exchange" /> 
						</template>
					</i18n>
					<i18n v-else path="donateModalDonateAmountForAny" tag="label" id="donate-amount">
						<template #amount>
							<byte-amount :amount="Math.round(nb_reward*amount*gb_to_bytes)"/> 
						</template>
					</i18n>	
				</div>
			</b-row >
		</b-container>
		<b-container v-else fluid >
			<b-row class="pt-3">
				{{$t("donateModalLinkHeader")}}
			</b-row >
		<b-row class="pt-3">
			<span class="text-break">
				<a :href="link">{{link}}</a>
			</span>
			</b-row >
			<b-row class="py-3">
				{{$t("donateModalLinkFooter")}}
			</b-row >
		</b-container>
	</b-modal>
</template>

<script>
import ByteAmount from './ByteAmount.vue';
const conf = require("../../conf.js");

export default {	
	components: {
		ByteAmount
	},
	data(){
		return {
				objExchanges: {},
				isForAny: false,
				amount: conf.min_reward_gb,
				exchange: "",
				nb_reward:1,
				link: false,
				gb_to_bytes: conf.gb_to_bytes
		}
	},
	computed: {
		validExchange() {
			if (this.isForAny)
				return null;
			return !!this.objExchanges[this.exchange]
		}
	},
	mounted(){
		this.axios.get('/api/exchanges').then((response) => {
			response.data.forEach((row)=>{
				this.objExchanges[row.id] = row.name;
				});
		});
	},
	methods:{
		handleOk(bvModalEvt){
			bvModalEvt.preventDefault()	;
			const base64url = require('base64url');
			const data = {
					number_of_rewards: this.nb_reward,
					reward_amount: this.amount * conf.gb_to_bytes
			};
			if (!this.isForAny)
				data.exchange = this.exchange;
			const json_string = JSON.stringify(data);
			const base64data = base64url(json_string);
			this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount="
				+(Math.round(this.nb_reward * this.amount * conf.gb_to_bytes))+"&base64data="+base64data;
		}
	}
}
</script>

<style lang='scss' scoped>
</style>