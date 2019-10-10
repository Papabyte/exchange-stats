<template>
	<b-modal id="claimGain" :title="getTitle" :hide-footer="true" >
		<b-container v-if="!link" fluid >
			<b-row>
				Select the address.
			</b-row>
			<b-row v-if="this.operation_item.claimAddresses" class="pt-3" >
				<div v-for="(address,index) in this.operation_item.claimAddresses" :key="index">
					<b-button variant="primary"  class="mb-2" size="m"  @click="claim(address)">{{address}}</b-button>
				</div>
			</b-row >
		</b-container>
		<b-container v-else fluid >
			<b-row class="pt-3">
				By clicking the link below, your Obyte wallet will open and ready to send a transaction for claiming your gain.
			</b-row >
		<b-row class="pt-3">
			<span class="text-break">
				<a :href="link">{{link}}</a>
			</span>
			</b-row >
			<b-row class="py-3">
				It will be taken into account after a few minutes when the transaction is confirmed.
			</b-row >
		</b-container>
	</b-modal>
</template>

<script>
const conf = require("../../conf.js");
export default {	
	components: {
		
	},
	props: ['prop_operation_item'],
	data(){
		return {
			text_error: null,
			items: [],
			link: false,
			operation_item: {}
		}
	},
	watch:{
		prop_operation_item:function(){
			this.operation_item = this.prop_operation_item;
			this.listAddresses();
		}


	},
	computed:{
		getTitle:function(){
				return "Claim a gain";
		}
	},
	methods:{
		listAddresses(){

		},
		claim(address){
				const base64url = require('base64url');
				const data = {
						withdraw:1,
						operation_id: this.operation_item.key,
						address: address
				};

				const json_string = JSON.stringify(data);
				const base64data = base64url(json_string);
				this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount=10000&base64data="+base64data;
				window.open(href, '_blank');
		}
	}
}
</script>

<style lang='scss' scoped>
</style>