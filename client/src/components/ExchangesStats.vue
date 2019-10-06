<template>
	<div class="main">
	<NavBar selected_item='0' />
	<RankingTable />

</div>
</template>

<script>
import NavBar from './NavBar.vue'
import RankingTable from './RankingTable.vue'

export default {
	name: 'ExchangesStats',
	components: {
		NavBar,
		RankingTable
	}
}
</script>

