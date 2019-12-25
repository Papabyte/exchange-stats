<template>
	<div class="container box">
		<b-button
				class="is-pulled-right"
				type="is-warning"
				@click="donateReward()">
			{{$t('crowdSourcingPoolsButtonDonate')}}
		</b-button>

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
				aria-current-label="Current page">
			<template slot-scope="props">
				<b-table-column field="number_rewards" :label="$t('crowdSourcingPoolsNbOfRewards')" sortable>
					{{props.row.number_rewards}}
				</b-table-column>

				<b-table-column field="reward_amount" :label="$t('crowdSourcingPoolsRewardAmount')" sortable>
					<byte-amount :amount="Number(props.row.reward_amount)"/>
				</b-table-column>

				<b-table-column field="exchange" :label="$t('crowdSourcingPoolsExchange')" sortable>
					{{props.row.exchange}}
				</b-table-column>
			</template>
		</b-table>
	</div>
</template>

<script>

	import ByteAmount from './commons/ByteAmount.vue'
	import DonateRewardModal from './commons/DonateRewardModal.vue'
	import { ModalProgrammatic } from 'buefy'
	import SetNicknameModal from './commons/SetNicknameModal'

	export default {
		components: {
			ByteAmount
		},
		data () {
			return {
				pools: null,
				isSpinnerActive: true,
				currentPage: 1,
				totalRows: 0,
				timerId: null,
				sortBy: 'reward_amount',
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
				this.axios.get('/api/pools').then((response) => {
					this.items = response.data
					this.totalRows = this.items.length
					this.isSpinnerActive = false
				})
			},
			donateReward () {
				ModalProgrammatic.open({
					parent: this,
					component: DonateRewardModal,
					hasModalCard: true
				})
			}
		},
	}
</script>

<style>

</style>
