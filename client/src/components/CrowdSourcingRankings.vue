<template>
	<b-row class="main-col pt-3">
		<set-nickname-modal />
		<b-col cols="12" class="text-center text-lg-right">
			<b-button 
				variant="primary" 
				v-on:click="$bvModal.show('setNickname');"  
				class="mb-2 mb-lg-n5 mr-2 text-nowrap" size="s" >
				{{$t('crowdsourcingRankingButtonSetNickname')}}
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
	import SetNicknameModal from './commons/SetNicknameModal.vue';

	export default {
		components: {
			ContributorsRanking,
			DonatorsRanking,
			SetNicknameModal
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
