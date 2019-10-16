<template>
	<div class="main">
		<nav-bar selected_item='0' />
			<b-container fluid>
				<b-row>
					<b-col offset-lg="1" lg="10" cols="12" class="py-3">
						<b-alert show dismissible>
						{{$t('welcomeMessageRanking')}}
						</b-alert>
					</b-col>
				</b-row >
			</b-container>
		<ranking-table />
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

