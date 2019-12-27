<template>
	<section class="section">
		<div class="container">
			<h3 class="title is-3 mb-2">{{$t('rankingGraphTitle', {exchange: assocExchanges[exchange]})}}</h3>
		</div>
		<div class="container box">
				<highcharts :options="chartOptions"></highcharts>
		</div>
		<div class="container">
			<div class="mt-1">{{$t('rankingGraphLegendTimespan')}}</div>
		</div>
		<div class="container">
			<div class="mt-1">{{$t('rankingGraphLegendWallets',{creation_date: creation_date})}}</div>
				<span class="wallet-wrapper mt-1" v-for="(wallet,index) in exchangeWallets" v-bind:key="index">
					<div class="field">
						<span class="control">
							<wallet-id :id="Number(wallet)"/>
						</span>
					</div>
				</span>
		</div>
	</section>
</template>

<script>
	import { Chart } from 'highcharts-vue'
	import WalletId from './commons/WalletId.vue'

	const conf = require('../conf.js')

	export default {
		components: {
			highcharts: Chart,
			WalletId,
		},
		props: {
			exchange: {
				type: String,
				required: true,
			},
		},
		data () {
			return {
				chartOptions: {
					series: [],
				},
				exchangeWallets: [],
				creation_date: '',
			}
		},
		computed: {
			assocExchanges () {
				return this.$store.state.exchangesById
			},
		},
		created () {
			this.chartOptions.title = { text: '' }
			this.chartOptions.chart = {
				type: 'line',
				zoomType: 'x',
				panning: true,
				panKey: 'shift',
			}
			this.axios.get('/api/exchange-history/' + this.exchange).then((response) => {
				const data = response.data.history
				this.exchangeWallets = response.data.info.wallets.split('@')
				this.creation_date = response.data.info.creation_date
				this.chartOptions.zoomType = 'x'

				this.chartOptions.xAxis = {
					type: 'datetime',
					dateTimeLabelFormats: {
						day: '%e %b %y',
					},
				}
				this.chartOptions.yAxis = {
					labels: {
						format: '{value} BTC',
					},
				}
				this.chartOptions.series.push({
					data: data.map(function (row) {
						return {
							x: row.time_start * 1000,
							y: row.balance / 100000000,
						}
					}),
					name: 'Balance',
				})
				this.chartOptions.series.push({
					data: data.map(function (row) {
						return {
							x: row.time_end * 1000,
							y: row.total_deposited / 100000000,
						}
					}),
					name: 'Daily deposited',
				})
				this.chartOptions.series.push({
					data: data.map(function (row) {
						return {
							x: row.time_end * 1000,
							y: row.total_withdrawn / 100000000,
						}
					}),
					name: 'Daily withdrawn',
				})
			})
			document.title = this.$t('rankingGraphPageTitle',
				{ exchange: this.assocExchanges[this.exchange], website_name: conf.website_name })
			document.getElementsByName('description')[0].setAttribute('content',
				this.$t('rankingGraphDescription', { exchange: this.assocExchanges[this.exchange] }))
		},
	}
</script>
<style lang="scss" scoped>

	.wallet-wrapper {
		display: inline-block;
		margin-left: 15px;

		&:first-child {
			margin-left: 0;
		}
	}
</style>