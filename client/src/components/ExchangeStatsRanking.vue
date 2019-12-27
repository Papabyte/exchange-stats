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
							<BtcAmount :amount="props.row.reported_volume"/>
						</b-table-column>

						<b-table-column field="last_month_volume" :label="$t('rankingTableColMonthlyVolume')" sortable>
							<BtcAmount v-if="props.row.last_month_volume" :amount="props.row.last_month_volume"/>
						</b-table-column>

						<b-table-column field="nb_addresses" :label="$t('rankingTableColNbAddresses')" sortable>
							{{ props.row.nb_deposit_addresses }}
						</b-table-column>

						<b-table-column field="total_btc_wallet" :label="$t('rankingTableColTotalBtcWallet')" sortable>
							<BtcAmount v-if="props.row.total_btc_wallet" :amount="props.row.total_btc_wallet"/>
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
							<router-link v-if="props.row.total_btc_wallet || props.row.nb_withdrawal_addresses"
											:to="'/explorer/'+ props.row.exchange_id">
								<b-button type="is-info" outlined class="text-nowrap">
									{{$t('rankingTableButtonExploreWallet')}}
								</b-button>
							</router-link>

							<b-dropdown aria-role="list">
								<button class="button is-info is-outlined" slot="trigger">
									<span>{{ $t('rankingTableButtonEdit') }}</span>
									<b-icon icon="menu-down"></b-icon>
								</button>
								<b-dropdown-item aria-role="listitem" @click="addAWallet(props.row.exchange_id)">
									{{$t('rankingTableButtonAddWallet')}}
								</b-dropdown-item>
								<b-dropdown-item aria-role="listitem"
																	v-if="props.row.total_btc_wallet || props.row.nb_withdrawal_addresses"
																	@click="removeAWallet(props.row.exchange_id)">
									{{$t('rankingTableButtonRemoveWallet')}} - {{ props.row.exchange_id }}
								</b-dropdown-item>
							</b-dropdown>
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
	import EditWalletModal from './commons/EditWalletModal.vue'
	import ExchangeTrend from './commons/ExchangeTrend.vue'
	import { ModalProgrammatic } from 'buefy'

	export default {
		components: {
			BtcAmount,
			ExchangeTrend,
		},
		data () {
			return {
				data: [],
				isRemoving: false,
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
					})
					this.data = response.data
				})

				this.isLoading = false
			},
			addAWallet (exchange) {
				ModalProgrammatic.open({
					parent: this,
					component: EditWalletModal,
					hasModalCard: true,
					props: { propExchange: exchange, isRemoving: false },
				})
			},
			removeAWallet (exchange) {
				ModalProgrammatic.open({
					parent: this,
					component: EditWalletModal,
					hasModalCard: true,
					props: { propExchange: exchange, isRemoving: true },
				})
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

</style>
