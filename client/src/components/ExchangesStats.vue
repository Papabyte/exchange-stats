<template>
	<div class="main">
		<nav-bar selected_item='0' />

		<section class="section">
			<div class="container">
				<b-notification v-if="welcomeMessageShown" type="is-info" aria-close-label="Close" @close="$store.commit('setWasRankingWelcomeMessageClosed',true)">
					{{$t('rankingWelcomeMessage')}}
				</b-notification>
			</div>
		</section>
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

<style scoped>
	.section {
		padding: 2rem 1.5rem;
	}

</style>
