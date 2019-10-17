<template>
	<div>
	<nav-bar selected_item='2'/>
		<b-container fluid >
			<b-row >
				<b-col offset-lg="2" lg="8"  cols="12" class="py-3">
					<h3 class="text-center">{{$t("crowdSourcingCurrentOperations")}}</h3>
						<current-operations />
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

export default {
	components: {
		NavBar,
		CurrentPools,
		CurrentOperations,
		LastTransactions
	},
	created(){
		document.title = this.$("crowdSourcingPageTitle");
		document
			.getElementsByTagName('meta')
			.namedItem('description')
			.setAttribute('content', this.$("crowdSourcingMetaDescription"))
	}
}
</script>

<style lang='scss'>

</style>
