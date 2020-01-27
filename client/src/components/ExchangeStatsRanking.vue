<template>
	<section class="section">
		<div class="container">
			<h3 class="title is-3 mb-2">{{$t('rankingTitle')}}</h3>
		</div>
		<div class="container">
			<div v-if="!isLoading" class="box">
				<b-table
						:data="data"
						ref="table"
						detailed
						hoverable
						:detail-key="data.name"
						:show-detail-icon="!isVisible"
						:paginated="isPaginated"
						:loading="isLoading"
						:per-page="perPage"
						:current-page.sync="currentPage"
						:pagination-simple="isPaginationSimple"
						:pagination-position="paginationPosition"
						:default-sort-direction="defaultSortDirection"
						:sort-icon="sortIcon"
						:sort-icon-size="sortIconSize"
						@sort="currentPage=1"
						default-sort="total_btc_wallet"
						aria-next-label="Next page"
						aria-previous-label="Previous page"
						aria-page-label="Page"
						aria-current-label="Current page">

					<template slot-scope="props">

						<b-table-column field="name" :label="$t('rankingTableColName')" sortable>
							{{ props.row.name }}
						</b-table-column>

						<b-table-column field="reported_volume" :label="$t('rankingTableColReportedVolume')" sortable>
							<template slot="header" slot-scope="{ column }">
								<b-tooltip type="is-info" :label="$t('rankingTableColReportedVolumeTip')">
									{{ column.label }} <v-icon name='help-circle' class="tip-icon"/>
								</b-tooltip>
							</template> 
							<BtcAmount :amount="props.row.reported_volume"/>
						</b-table-column>

						<b-table-column field="reported_ratio" :label="$t('rankingTableColReportedReportedRatio')" sortable>
							<template slot="header" slot-scope="{ column }">
								<b-tooltip type="is-info" :label="$t('rankingTableColReportedReportedRatioTip')">
									{{ column.label }}<v-icon name='help-circle' class="tip-icon"/>
								</b-tooltip>
							</template> 
								<span v-if="props.row.reported_ratio"> {{props.row.reported_ratio.toPrecision(3)}} </span>
						</b-table-column>

						<b-table-column field="nb_addresses" :label="$t('rankingTableColNbAddresses')" sortable>
							<router-link :to="'/wallets-for-exchange/'+ props.row.exchange_id">
							{{ props.row.nb_addresses ? props.row.nb_addresses.toLocaleString() : '' }}
							</router-link>
						</b-table-column>

						<b-table-column field="total_btc_wallet" :label="$t('rankingTableColTotalBtcWallet')" sortable>
							<router-link v-if="props.row.total_btc_wallet"
											:to="'/explorer/'+ props.row.exchange_id">
								<BtcAmount v-if="props.row.total_btc_wallet" :amount="props.row.total_btc_wallet"/>
							</router-link>
						</b-table-column>

						<b-table-column field="last_day_deposits" :label="$t('rankingTableColLastDayDeposits')" sortable>
							<BtcAmount v-if="props.row.last_day_deposits" :amount="props.row.last_day_deposits"/>
						</b-table-column>

						<b-table-column field="last_day_withdrawals" :label="$t('rankingTableColLastDayWithdrawals')" sortable>
							<BtcAmount v-if="props.row.last_day_withdrawals" :amount="props.row.last_day_withdrawals"/>
						</b-table-column>

						<b-table-column field="actions" :label="$t('rankingTableColTrend')" :visible="isVisible">
							<router-link :to="{name: 'exchangesStats', params: { exchange: props.row.exchange_id } }">
								<exchange-trend v-if="props.row.trend" :data="props.row.trend"/>
							</router-link>
						</b-table-column>

						<b-table-column field="actions" :label="$t('rankingTableColAction')">
							<contribute :row="props.row" />
						</b-table-column>
					</template>

					<template slot="detail" slot-scope="props">
						<article class="media">
							<figure class="media-left">
								<h6 class="title is-6 mb-2">{{$t('rankingTableColTrend')}}</h6>
								<router-link :to="{name: 'exchangesStats', params: { exchange: props.row.exchange_id } }">
									<exchange-trend v-if="props.row.trend" :data="props.row.trend"/>
								</router-link>
							</figure>
						</article>
					</template>
				</b-table>
			</div>
			<div v-else class="box">
				<b-loading label="Spinning" :is-full-page="true" :active.sync="isLoading"
									 :can-cancel="true"></b-loading>
			</div>
		</div>
	</section>

</template>

<script>
	import BtcAmount from './commons/BtcAmount.vue'
	import ExchangeTrend from './commons/ExchangeTrend.vue'
	import Contribute from './ExchangeStatsRankingContribute.vue'

	export default {
		components: {
			BtcAmount,
			ExchangeTrend,
			Contribute
		},
		data () {
			return {
				data: [],
				clicked_exchange: null,
				isPaginated: true,
				isPaginationSimple: false,
				paginationPosition: 'bottom',
				defaultSortDirection: 'desc',
				sortIcon: 'arrow-up',
				sortIconSize: 'is-small',
				currentPage: 1,
				perPage: 20,
				isLoading: false,
				isVisible: true,
			}
		},
		methods: {
			onResize () {
				this.isVisible = window.innerWidth > 1216
			},
			loadData () {
				this.isLoading = true

				this.axios.get('/api/ranking').then((response) => {
					this.total = response.data.length
					response.data.forEach(function (row) {
						if (row.trend)
							row.trend = row.trend.split('@').map(function (value) {
								return Number(value)
							})
						if (row.reported_volume && (row.last_day_deposits || row.last_day_withdrawals))
							row.reported_ratio = row.reported_volume/((row.last_day_deposits + row.last_day_withdrawals)/2)
					})
					this.data = response.data
				})

				this.isLoading = false
			},
			onPageChange (page) {
				this.page = page
				this.loadData()
			},
			toggle (row) {
				this.$refs.table.toggleDetails(row)
			},
		},
		mounted () {
			this.loadData()
			this.onResize()
			window.addEventListener('resize', this.onResize, { passive: true })
		},
		beforeDestroy () {
			if (typeof window !== 'undefined') {
				window.removeEventListener('resize', this.onResize, { passive: true })
			}
		},
	}
</script>

<style lang="scss" scoped>
	.mb-2 {
		margin-bottom: 2rem;
	}

	.btn-group {
		width: 100%;
		justify-content: flex-start;
		display: flex;
		@media screen and (max-width: 768px) {
			justify-content: flex-end;
		}

		a {
			margin-right: 10px;

			&:hover {
				text-decoration: none;
			}
		}
	}

	.tip-icon{
		margin-right: 5px;
		padding-bottom: 5px;
	}

</style>
