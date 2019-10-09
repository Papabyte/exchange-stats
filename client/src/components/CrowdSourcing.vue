<template>
	<div>
	<NavBar selected_item='2' />
			<b-container fluid >
							<b-row >
				<b-col offset-lg="2" lg="8"  cols="12" class="py-3">
					<h3 class="text-center">Current operations</h3>
						<CurrentOperations />
				</b-col>
			</b-row >
			<b-row >
				<b-col offset-lg="2" lg="4"  cols="12" class="py-3">
					<h3 class="text-center">Current rewards</h3>
						<CurrentPools />
				</b-col>
			</b-row >
			</b-container>
	</div>
</template>

<script>
import NavBar from './commons/NavBar.vue'
import CurrentPools from './CrowdSourcingPools.vue'
import CurrentOperations from './CrowdSourcingOperations.vue'

export default {
	components: {
		NavBar,
		CurrentPools,
		CurrentOperations
	}
}
</script>

<style lang='scss'>

</style>
