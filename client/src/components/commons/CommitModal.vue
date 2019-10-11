<template>
	<b-modal id="commitOperation" :title="getTitle"  :hide-footer="true" >
		<b-container fluid >
			<b-row class="pt-3">
				By clicking the link below, your Obyte wallet will open and ready to send a transaction for committing operation.
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
			link: false,
			operation_item: {}
		}
	},
	computed:{
		getTitle:function(){
			return "Commit an operation";
		}
	},
	watch:{
		operationItem:function(){
			this.operation_item = this.operationItem;
			this.createLink();
		}
	},
	methods:{
		createLink(address){
				const base64url = require('base64url');
				const data = {
						exchange: this.operation_item.exchange,
						commit: 1
				};
				if (this.operation_item.initial_outcome == "in")
					data.add_wallet_id= this.operation_item.wallet_id;
				else
					data.remove_wallet_id= this.operation_item.wallet_id;

				const json_string = JSON.stringify(data);
				const base64data = base64url(json_string);
				this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount=10000&base64data="+base64data;
			}
		}
}
</script>

<style lang='scss' scoped>
</style>