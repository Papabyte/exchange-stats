<template>
	<div>
	<NavBar selected_item='2' />
			<b-container fluid >
			<b-row >
				<b-col offset-lg="1" lg="4"  cols="6" class="py-3">
					<h3 class="text-center">Current rewards</h3>
						<CurrentPools />
				</b-col>
			</b-row >
			</b-container>
	</div>
</template>

<script>
import NavBar from './NavBar.vue'
import CurrentPools from './CurrentPools.vue'

export default {
	components: {
		NavBar,
		CurrentPools
	}
}
</script>

<style lang='scss'>

</style>
