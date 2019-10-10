<template>
	

	<b-modal id="viewUrlProofs" :title="getTitle" hide-footer>
		<b-container  >
			<b-row v-if="proofsByOutcome.in && proofsByOutcome.in.length>0" class="pt-3" >
				<b-col cols="12">
					<b-row>
						Proofs for adding wallet to exchange.
					</b-row >
					<b-row v-for="(url,index) in proofsByOutcome.in" :key="index">
						<b-link :href="url" target="_blank">{{url}}</b-link>
					</b-row>
				</b-col>
			</b-row>
			<b-row v-if="proofsByOutcome.out && proofsByOutcome.out.length>0" class="pt-3" >
				<b-col cols="12">
					<b-row>
						Proofs for removing wallet from exchange.
					</b-row >
					<b-row v-for="(url,index) in proofsByOutcome.out" :key="index">
						<b-link :href="url" target="_blank">{{url}}</b-link>
					</b-row>
				</b-col>
			</b-row>
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
			proofsByOutcome: {}
		}
	},
	watch:{
		prop_operation_item:function(){
				this.proofsByOutcome = this.prop_operation_item.url_proofs_by_outcome || {};
		}

	},
	mounted(){
		this.$emit('init');
	},
	computed:{
		getTitle:function(){
			return "View proofs";
		}
	},
	methods:{
	
	}
}
</script>

<style lang='scss' scoped>
</style>