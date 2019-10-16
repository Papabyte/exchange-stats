<template>
	<b-modal id="claimGain" :title="getTitle" :hide-footer="true" >
		<b-container v-if="!link" fluid >
			<b-row>
				{{$t("claimModalSelectAddress")}}
			</b-row>
			<b-row v-if="this.operation_item.claimAddresses" class="pt-3" >
				<div v-for="(address,index) in this.operation_item.claimAddresses" :key="index">
					<b-button variant="primary" @click="claim(address)" class="mb-2" size="m" >{{address}}</b-button>
				</div>
			</b-row >
		</b-container>
		<b-container v-else fluid >
			<b-row class="pt-3">
				{{$t("claimModalLinkHeader")}}
			</b-row >
		<b-row class="pt-3">
			<span class="text-break">
				<a :href="link">{{link}}</a>
			</span>
			</b-row >
			<b-row class="py-3">
				{{$t("claimModalLinkFooter")}}
			</b-row >
		</b-container>
	</b-modal>
</template>

<script>
const conf = require("../../conf.js");
export default {	
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
			items: [],
			link: false,
			operation_item: {}
		}
	},
	computed:{
		getTitle:function(){
				return "Claim a gain";
		}
	},
	watch:{
		operationItem:function(){
			this.operation_item = this.operationItem;
			this.listAddresses();
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