<template>
	<b-modal id="donateReward" title="Donate a reward" @close="link=false" :hide-footer="!!link" :okDisabled="!validExchange && !isForAny" @ok="handleOk">
		<b-container v-if="!link" fluid  >
			<b-row >
				<label for="input-with-list">Select the exchange for which your reward will apply</label>
				<b-form-input list="input-list"  :state="validExchange" v-model="exchange" id="input-with-list"  :disabled="isForAny"></b-form-input>
				<b-form-datalist id="input-list" :options="objExchanges"  ></b-form-datalist>
			</b-row >
			<b-row class="pt-3" >
				<b-form-checkbox
				id="checkbox-1"
				v-model="isForAny"
				name="checkbox-1"
				>
				Donate for any exchange
				</b-form-checkbox>
			</b-row >
			<b-row class="pt-3" >
				<label for="range-1">Individual reward amount</label>
			<b-form-input id="range-1" v-model="amount" type="range" min="0.01" max="10" step="0.01"></b-form-input>
				<byteAmount :amount="amount*1000000000"/>
			</b-row >
			<b-row class="pt-3" >
				<label for="range-2">Number of rewards</label>
				<b-form-input id="range-2" v-model="nb_reward" type="range" min="1" max="10" step="1"></b-form-input>
				{{nb_reward}}
			</b-row >
			<b-row class="pt-3" >
				<div v-if="validExchange || isForAny" ><p>Donate <byteAmount :amount="Math.round(nb_reward*amount*1000000)"/> for operation on {{isForAny ? "any exchange" : exchange}}</p></div>
			</b-row >
		</b-container>
		<b-container v-else fluid >
			<b-row class="pt-3">
				By clicking the link below, your Obyte wallet will open and ready to send a transaction for donating a reward.
			</b-row >
		<b-row class="pt-3">
			<span class="text-break">
				<a :href="link">{{link}}</a>
			</span>
			</b-row >
			<b-row class="py-3">
				Your donation will be taken into account after a few minutes when the transaction is confirmed.
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
				amount: 0.1,
				exchange: "",
				nb_reward:1,
				link: false
		}
	},
	props: [],
	mounted(){
		this.axios.get('/api/exchanges').then((response) => {
			console.log(response.data);
		response.data.forEach((row)=>{
			this.objExchanges[row.id] = row.name;
			});
		});
	this.$emit('init');

	},
	computed: {
		validExchange() {
			if (this.isForAny)
				return null;
			return !!this.objExchanges[this.exchange]
		}
	},
	methods:{
		handleOk(bvModalEvt){
			bvModalEvt.preventDefault()	;
			const base64url = require('base64url');
			const data = {
					number_of_rewards: this.nb_reward,
					reward_amount: this.amount * 1000000000
			};
			if (!this.isForAny)
				data.exchange = this.exchange;
			const json_string = JSON.stringify(data);
			const base64data = base64url(json_string);
			this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount="
				+(Math.round(this.nb_reward * this.amount * 1000000000))+"&base64data="+base64data;
	
		}
	}
}
</script>

<style lang='scss' scoped>
</style>