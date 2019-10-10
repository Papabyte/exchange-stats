<template>
	<div class="main">
	<NavBar selected_item='0' />
	<RankingTable />

</div>
</template>

<script>
import NavBar from './commons/NavBar.vue'
import RankingTable from './ExchangeStatsRanking.vue'
import BtcAmount from './commons/BtcAmount.vue';

export default {
	name: 'ExchangesStats',
	components: {
		NavBar,
		RankingTable
	},
	created(){
		document.title = 'Exchange onchain statistics';
	}
}
</script>

