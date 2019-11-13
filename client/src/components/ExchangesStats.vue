<template>
	<div class="main">
		<nav-bar selected_item='0' />
			<b-container fluid>
				<b-row>
					<b-col offset-lg="1" lg="10" cols="12" class="py-3">
						<b-alert v-if="welcomeMessageShown" @dismissed="$store.commit('setWasRankingWelcomeMessageClosed',true)" variant="welcome-message" show dismissible>
						{{$t('rankingWelcomeMessage')}}
						</b-alert>
					</b-col>
				</b-row >
			</b-container>
		<exchange-graph v-if="exchange" :exchange="exchange"/>
		<ranking-table v-else />
	</div>
</template>

<script>
import NavBar from './commons/NavBar.vue'
import RankingTable from './ExchangeStatsRanking.vue'
import BtcAmount from './commons/BtcAmount.vue';
import ExchangeGraph from './ExchangeStatsGraph.vue';

const conf = require("../conf.js");

export default {
	name: 'ExchangesStats',
	components: {
		NavBar,
		RankingTable,
		ExchangeGraph
	},
	props: {
		exchange: {
			type: String,
			required: false
		}
	},
	computed:{
		welcomeMessageShown(){
			return !this.$store.state.wasRankingWelcomeMessageClosed;
		}
	},
	created(){
		document.title = this.$t('rankingPageTitle', {website_name: conf.website_name});
		document.getElementsByName('description')[0].setAttribute('content',this.$t("rankingMetaDescription"));
	}
}
</script>

