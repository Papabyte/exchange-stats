<template>
	<div>
		<nav-bar selected_item='2'/>
		<b-container fluid >
				<b-row>
					<b-col offset-lg="2" lg="8" cols="12" class="py-3">
						<b-alert v-if="welcomeMessageShow" @dismissed="$store.commit('setWasCrowdSourcingWelcomeMessageClosed',true)" show dismissible>
						{{$t('crowdSourcingWelcomeMessage')}}
						</b-alert>
					</b-col>
				</b-row >
			<b-row >
				<b-col offset-lg="2" lg="8"  cols="12" class="py-3">
					<h3 class="text-center">{{$t("crowdSourcingCurrentOperations")}}</h3>
						<current-operations />
				</b-col>
			</b-row >
						<b-row >
				<b-col offset-lg="2" lg="8"  cols="12" class="py-3">
					<h3 class="text-center">{{$t("crowdSourcingRanking")}}</h3>
						<rankings />
				</b-col>
			</b-row >
			<b-row >
				<b-col offset-lg="2" lg="8"  cols="12" class="py-3">
					<b-row >
						<b-col lg="6"  cols="12" class="pr-lg-5 py-3">
							<h3 class="text-center">{{$t("crowdSourcingCurrentRewards")}}</h3>
								<current-pools />
						</b-col>
						<b-col lg="6"  cols="12" class="pl-lg-5 ml-auto py-3">
							<h3 class="text-center">{{$t("crowdSourcingLastTransactions")}}</h3>
							<last-transactions />
						</b-col>
					</b-row >
				</b-col>
			</b-row >
		</b-container>
	</div>
</template>

<script>
import NavBar from './commons/NavBar.vue'
import CurrentPools from './CrowdSourcingPools.vue'
import CurrentOperations from './CrowdSourcingOperations.vue'
import LastTransactions from './CrowdSourcingTransactions.vue'
import Rankings from './CrowdSourcingRankings.vue'
const conf = require("../conf.js");

export default {
	components: {
		NavBar,
		CurrentPools,
		CurrentOperations,
		LastTransactions,
		Rankings
	},
	computed:{
		welcomeMessageShow(){
			return !this.$store.state.wasCrowdSourcingWelcomeMessageClosed;
		}
	},
	created(){
		document.title = this.$t("crowdSourcingPageTitle", {website_name: conf.website_name});
		document.getElementsByName('description')[0].setAttribute('content',this.$t("crowdSourcingMetaDescription"));
	}
}
</script>

<style lang='scss'>

</style>
