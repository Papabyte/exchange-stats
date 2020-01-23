<template>
	<div class="main">
		<nav-bar/>

		<section class="section">
			<div class="container">
				<b-notification v-if="welcomeMessageShown" type="is-info" aria-close-label="Close"
												@close="$store.commit('setWasRankingWelcomeMessageClosed',true)">
					{{$t('rankingWelcomeMessage')}}
				</b-notification>
			</div>
		</section>
		<exchange-graph v-if="exchange" :exchange="exchange"/>
		<ranking-table v-else/>
	</div>
</template>

<script>
	import NavBar from './commons/NavBar.vue'
	import RankingTable from './ExchangeStatsRanking.vue'
	import BtcAmount from './commons/BtcAmount.vue'
	import ExchangeGraph from './ExchangeStatsGraph.vue'
	import meta from '../mixins/meta'

	const conf = require('../conf.js')
	
	export default {
		mixins:[meta],
		components: {
			NavBar,
			RankingTable,
			ExchangeGraph
			
		},
		props: {
			exchange: {
				type: String,
				required: false,
			},
		},
		computed: {
			welcomeMessageShown () {
				return !this.$store.state.wasRankingWelcomeMessageClosed
			},
			assocExchanges () {
				return this.$store.state.exchangesById
			},
		},
		watch: {
			exchange: function () {
				this.updateMeta();

			},
		},
		mounted () {
			this.updateMeta();
			
		},
		methods: {
			updateMeta: function(){
				this.setRobotDirective('all')
				if (this.exchange){
					this.setTitle(this.$t('rankingGraphPageTitle', { exchange: this.assocExchanges[this.exchange].name, website_name: conf.website_name }))
				this.setMetaDescription(this.$t('rankingGraphDescription', { exchange: this.assocExchanges[this.exchange].name }))
				} else {
					this.setTitle(this.$t('rankingPageTitle', { website_name: conf.website_name }))
					this.setMetaDescription(this.$t('rankingMetaDescription'))
				}
			}
		}
	}
</script>

<style scoped>
	.section {
		padding: 2rem 1.5rem;
	}

</style>
