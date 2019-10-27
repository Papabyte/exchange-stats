<template>
	<div class="main">
		<nav-bar selected_item='0' />
			<b-container fluid>
				<b-row>
					<b-col offset-lg="1" lg="10" cols="12" class="py-3">
						<b-alert v-if="welcomeMessageShow" @dismissed="$store.commit('setWasRankingWelcomeMessageClosed',true)" show dismissible>
						{{$t('rankingWelcomeMessage')}}
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
	computed:{
		welcomeMessageShow(){
			return !this.$store.state.wasRankingWelcomeMessageClosed;
		}
	},
	created(){
		document.title = this.$t('rankingPageTitle');
		var meta = document.createElement('meta');
		meta.name = "description";
		meta.content = this.$t("rankingMetaDescription");
	}
}
</script>

