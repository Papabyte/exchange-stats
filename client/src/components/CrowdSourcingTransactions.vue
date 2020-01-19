<template>
	<div class="container box">
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
				<b-table-column field="type" label="Type" sortable>
					{{props.row.type}}
				</b-table-column>

				<b-table-column field="unit" label="Unit" sortable>
					<a target="_blank"
									:href="(isTestnet ? 'https://testnetexplorer.obyte.org/#' : 'https://explorer.obyte.org/#')+props.row.unit">
						{{props.row.unit}}
					</a>
				</b-table-column>

				<b-table-column field="is_stable" label="Is Stable" sortable>
					{{props.row.is_stable}}
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

	export default {
		components: {},
		data () {
			return {
				isTestnet: conf.testnet,
				isSpinnerActive: true,
				currentPage: 1,
				totalRows: 0,
				sortBy: 'type',
				defaultSortDirection: 'desc',
				fields: [
					{ key: 'type', sortable: true },
					{ key: 'unit', sortable: true },
					{ key: 'is_stable', sortable: true },
				],
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
				this.axios.get('/api/aa_transactions').then((response) => {
					this.items = response.data
					this.totalRows = this.items.length
					this.isSpinnerActive = false
				})

								this.axios.get('/api/last-events').then((response) => {
				console.log(response.data)
				})
			},
		},
	}
</script>

<style>

</style>
