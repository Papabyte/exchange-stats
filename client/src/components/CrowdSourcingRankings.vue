<template>
	<div class="container">
		<set-nickname-modal/>
		<b-button
				class="is-pulled-right"
				type="is-warning"
				v-on:click="$bvModal.show('setNickname');">
			{{$t('crowdsourcingRankingButtonSetNickname')}}
		</b-button>

		<b-tabs type="is-boxed">
			<b-tab-item :label="$t('crowdSourcingContributorsTitle')">
				<contributors-ranking/>
			</b-tab-item>
			<b-tab-item :label="$t('crowdSourcingDonatorsTitle')">
				<donators-ranking/>
			</b-tab-item>
		</b-tabs>
	</div>
</template>

<script>

	const conf = require('../conf.js')
	import ContributorsRanking from './CrowdSourcingRankingContributors.vue'
	import DonatorsRanking from './CrowdSourcingRankingDonators.vue'
	import SetNicknameModal from './commons/SetNicknameModal.vue'

	export default {
		components: {
			ContributorsRanking,
			DonatorsRanking,
			SetNicknameModal,
		},
		data () {
			return {}
		},
		created () {

		},
		beforeDestroy () {
		},
		methods: {},
	}
</script>

<style>

</style>
