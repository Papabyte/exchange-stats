<template>
	<b-modal id="claimGain" :title="getTitle" @close="link=false" :hide-footer="true" >
		<b-container v-if="!link" fluid >
			<b-row>
				Select the address.
			</b-row>
			<b-row class="pt-3" >
				<div v-for="(address,index) in items" :key="index">
					<b-button  class="mb-2" size="m"  @click="claim(address)">{{address}}</b-button>
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
			link: false
		}
	},
	watch:{
		prop_operation_item:function(){
			console.log(this.prop_operation_item);


			this.listAddresses();
		}


	},
	computed:{
		getTitle:function(){
			if (!this.prop_operation_item)
				return "";
			else
				return "Claim a gain";
		}
	},
	methods:{
		listAddresses(){
			this.items = [];
			const assocStakedByAdress =	this.prop_operation_item.staked_by_address;
			const outcome = this.prop_operation_item.outcome
			for (var key in assocStakedByAdress){
				if (assocStakedByAdress[key][outcome])
					this.items.push(key);
			}

		},
		claim(address){
				const base64url = require('base64url');
				const data = {
						withdraw:1,
						challenge_id: this.prop_operation_item.key,
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