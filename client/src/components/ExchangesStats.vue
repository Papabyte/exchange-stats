<template>
	<div class="main">
		<nav-bar selected_item='0' />
		<b-container fluid>
			<b-row>
				<b-col offset-lg="1" lg="10" cols="12" class="py-3">
					<b-alert v-if="welcomeMessageShown" @dismissed="$store.commit('setWasRankingWelcomeMessageClosed',true)" variant="info" show dismissible>
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
const conf = require("../conf.js");

export default {
	name: 'ExchangesStats',
	components: {
		NavBar,
		RankingTable
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

