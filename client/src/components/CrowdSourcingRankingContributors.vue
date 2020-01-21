<template>
	<div class="container">
		<b-table
			:sort-by.sync="sortBy"
			:sort-desc.sync="defaultSortDirection"
			:data="items"
			ref="table"
			hoverable
			paginated
			per-page="10"
			:current-page.sync="currentPage"
			pagination-position="bottom"
			:default-sort-direction="defaultSortDirection"
			sort-icon="arrow-up"
			sort-icon-size="is-small"
			:default-sort="sortBy"
			aria-next-label="Next page"
			aria-previous-label="Previous page"
			aria-page-label="Page"
			aria-current-label="Current page"
		>
			<template slot-scope="props">
				<b-table-column field="address" :label="$t('crowdSourcingContributorsTableColAddress')" sortable>
					<user :address="props.row.address" :nickname="props.row.nickname"/>
				</b-table-column>
				<b-table-column field="initiatives" :label="$t('crowdSourcingContributorsTableColInitiatives')" sortable>
					{{props.row.initiatives}}
				</b-table-column>
				<b-table-column field="successes" :label="$t('crowdSourcingContributorsTableColSuccesses')" sortable>
					{{props.row.successes}}
				</b-table-column>
				<b-table-column field="income" :label="$t('crowdSourcingContributorsTableColIncome')" sortable>
					<byte-amount :isNegative="props.row.income<0" :isPositive="props.row.income>0"
											 :amount="props.row.income || 0"/>
				</b-table-column>
			</template>
			<template slot="empty">
				<section class="section">
					<div class="content has-text-grey has-text-centered">
						<p>
							<b-icon
								icon="emoticon-sad"
								size="is-large">
							</b-icon>
						</p>
						<p>{{$t("commonEmptyTable")}}</p>
					</div>
				</section>
			</template>
		</b-table>
	</div>
</template>

<script>

	const conf = require('../conf.js')
	import ByteAmount from './commons/ByteAmount.vue'
	import User from './commons/User.vue'

	export default {
		components: {
			ByteAmount,
			User,
		},
		data () {
			return {
				isTestnet: conf.testnet,
				isSpinnerActive: true,
				currentPage: 1,
				totalRows: 0,
				sortBy: 'initiatives',
				defaultSortDirection: 'desc',
				items: [],
			}
		},
		created () {
			this.getData()
			this.timerId = setInterval(this.getData, 60000)
		},
		beforeDestroy () {
			clearInterval(this.timerId)
		},
		methods: {
			getData () {
				this.axios.get('/api/contributors-ranking/').then((response) => {
					this.items = response.data
					this.totalRows = this.items.length
					this.isSpinnerActive = false
				})
			},
		},
	}
</script>

<style>

</style>
