<template>
	<div class="container">
		<b-button
				class="is-pulled-right"
				type="is-warning"
				@click="setNickname()">
			{{$t('crowdsourcingRankingButtonSetNickname')}}
		</b-button>

		<b-tabs type="is-boxed">
			<b-tab-item :label="$t('crowdSourcingContributorsTitle')">
				<contributors-ranking/>
			</b-tab-item>
			<b-tab-item :label="$t('crowdSourcingDonorsTitle')">
				<donors-ranking/>
			</b-tab-item>
		</b-tabs>
	</div>
</template>

<script>

	const conf = require('../conf.js')
	import ContributorsRanking from './CrowdSourcingRankingContributors.vue'
	import DonorsRanking from './CrowdSourcingRankingDonors.vue'
	import SetNicknameModal from './commons/SetNicknameModal.vue'
	import { ModalProgrammatic } from 'buefy'

	export default {
		components: {
			ContributorsRanking,
			DonorsRanking,
		},
		data () {
			return {}
		},
		created () {

		},
		beforeDestroy () {
		},
		methods: {
			setNickname () {
				ModalProgrammatic.open({
					parent: this,
					component: SetNicknameModal,
					hasModalCard: true
				})
			}
		},
	}
</script>

<style>

</style>
