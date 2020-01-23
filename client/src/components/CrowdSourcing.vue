<template>
	<div class="main">
		<nav-bar/>

		<section class="section">
			<div class="container">
				<b-notification v-if="welcomeMessageShow" type="is-info" aria-close-label="Close" @close="$store.commit('setWasCrowdSourcingWelcomeMessageClosed',true)">
					{{$t('crowdSourcingWelcomeMessage')}}
				</b-notification>
			</div>
		</section>

		<section class="section">
			<div class="container">
				<h3 class="title is-3 mb-2">{{$t('crowdSourcingCurrentOperations')}}</h3>
			</div>
			<current-operations />
		</section>

		<section class="section">
			<div class="container">
				<h3 class="title is-3 mb-2">{{$t('crowdSourcingRanking')}}</h3>
			</div>
			<div class="container box">
				<rankings />
			</div>
		</section>

		<section class="section">
			<div class="container">
				<div class="columns">
					<div class="column">
						<div class="container">
							<h3 class="title is-3 mb-2">{{$t('crowdSourcingCurrentRewards')}}</h3>
						</div>
						<current-pools />
					</div>
					<div class="column">
						<div class="container">
							<h3 class="title is-3 mb-2">{{$t('crowdSourcingLastEvents')}}</h3>
						</div>
						<last-events />
					</div>
				</div>
			</div>
		</section>
	</div>
</template>

<script>
import NavBar from './commons/NavBar.vue'
import CurrentPools from './CrowdSourcingPools.vue'
import CurrentOperations from './CrowdSourcingOperations.vue'
import LastEvents from './CrowdSourcingEvents.vue'
import Rankings from './CrowdSourcingRankings.vue'
import meta from '../mixins/meta'

const conf = require("../conf.js");

export default {
	mixins:[meta],
	components: {
		NavBar,
		CurrentPools,
		CurrentOperations,
		LastEvents,
		Rankings
	},
	computed:{
		welcomeMessageShow(){
			return !this.$store.state.wasCrowdSourcingWelcomeMessageClosed;
		}
	},
	created(){
		this.setTitle(this.$t("crowdSourcingPageTitle", {website_name: conf.website_name}))
		this.setMetaDescription(this.$t("crowdSourcingMetaDescription"))
		this.setRobotDirective('all')
	}
}
</script>

<style lang='scss'>

</style>
