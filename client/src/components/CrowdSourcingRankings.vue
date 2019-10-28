<template>
	<b-row class="main-col pt-3">
		<b-col cols="12" class="text-right">
			<b-button 
				variant="primary" 
				v-on:click="clicked_item=data.item;$bvModal.show('claimGain');"  
				class="mb-n5 mr-2 text-nowrap" size="s" >
				Set my nickname
			</b-button>
			<b-tabs content-class="mt-3 text-left">
				<b-tab title="Contributors" active>
					<contributors-ranking />
				</b-tab>
				<b-tab title="Donators">
					<donators-ranking />
				</b-tab>
			</b-tabs>
		</b-col>
	</b-row>
</template>

<script>

	const conf = require("../conf.js");
	import ContributorsRanking from './CrowdSourcingRankingContributors.vue';
	import DonatorsRanking from './CrowdSourcingRankingDonators.vue';

	export default {
		components: {
			ContributorsRanking,
			DonatorsRanking
		},
		data() {
			return {

			}
		},
		created(){

		},
		beforeDestroy(){
		},
		methods:{

		}
	}
</script>

<style >

.main-col{
}

</style>
