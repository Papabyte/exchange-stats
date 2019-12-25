<template>

	<div class="container">
		<contest-operation-modal :operationItem="clicked_item"/>
		<claim-gain-modal :operationItem="clicked_item"/>

		<div class="notification is-warning">
			<contributors-greeting/>
		</div>
		<div class="box">
			<div class="container">
				<b-table
						:sort-by.sync="sortBy"
						:sort-desc.sync="defaultSortDirection"
						:data="operations"
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
						<b-table-column field="status" :label="$t('crowdSourcingOperationsTableColStatus')" sortable>
							<b-tag type="is-primary">{{ props.row.status }}</b-tag>
						</b-table-column>
						<b-table-column field="operation" :label="$t('crowdSourcingOperationsTableColOperation')" sortable>
							<i18n v-if="props.row.initial_outcome=='in'" tag="div" path="crowdSourcingOperationsAddXToX" id="action">
								<template #wallet>
									<wallet-id :id="props.row.wallet_id"/>
								</template>
								<template #exchange>
									<exchange :id="props.row.exchange"/>
								</template>
							</i18n>
							<i18n v-else tag="div" path="crowdSourcingOperationsRemoveXFromX" id="action">
								<template #wallet>
									<wallet-id :id="props.row.wallet_id"/>
								</template>
								<template #exchange>
									<exchange :id="props.row.exchange"/>
								</template>
							</i18n>
						</b-table-column>
						<b-table-column field="outcome_yes_or_no" :label="$t('crowdSourcingOperationsTableColOutcome')" sortable>
							<b-tag type="is-info">{{ props.row.outcome_yes_or_no }}</b-tag>
						</b-table-column>

						<b-table-column field="staked_on_outcome" :label="$t('crowdSourcingOperationsTableColStakedOnOutcome')" sortable>
							<byte-amount :amount="props.row.staked_on_outcome"/>
						</b-table-column>

						<b-table-column field="total_staked" :label="$t('crowdSourcingOperationsTableColTotalStaked')" sortable>
							<byte-amount :amount="props.row.total_staked"/>
						</b-table-column>

						<b-table-column field="end" :label="$t('crowdSourcingOperationsTableColEnd')" sortable>
							<b-tag type="is-warning">{{ props.row.end }}</b-tag>
						</b-table-column>

						<b-table-column field="actions" :label="$t('crowdSourcingOperationsTableColAction')">

							<b-button-group>
								<b-tooltip type="is-info" :label="$t('crowdSourcingOperationsButtonContestTip')">
									<b-button
											class="button is-info is-outlined"
											v-if="props.row.status == 'onreview' && !props.row.is_commitable "
											v-on:click="clicked_item=data.item;$bvModal.show('contestOperation');">
										{{$t('crowdSourcingOperationsButtonContest')}}
									</b-button>
								</b-tooltip>

								<b-tooltip type="is-info" :label="$t('crowdSourcingOperationsButtonCommitTip')">
									<b-button
											class="button is-info is-outlined"
											v-if="props.row.status == 'onreview' && props.row.is_commitable"
											@click="commitOperation(props.row)">
										{{$t('crowdSourcingOperationsButtonCommit')}}
									</b-button>
								</b-tooltip>

								<b-tooltip type="is-info" :label="$t('crowdSourcingOperationsButtonClaimTip')">
									<b-button
											class="button is-info is-outlined"
											v-if="props.row.status == 'committed' && props.row.claimAddresses.length>0"
											v-on:click="clicked_item=props.row;$bvModal.show('claimGain');">
										123 {{$t('crowdSourcingOperationsButtonClaim')}}
									</b-button>
								</b-tooltip>
								<b-dropdown aria-role="list">
									<button class="button is-info is-outlined" slot="trigger">
										<span>{{ $t('crowdSourcingOperationsButtonView') }}</span>
										<b-icon icon="menu-down"></b-icon>
									</button>

									<b-dropdown-item
											aria-role="listitem"
											@click="viewUrlProofs(props.row)">
										{{$t('crowdSourcingOperationsButtonViewProofs')}}
									</b-dropdown-item>
									<b-dropdown-item
											@click="operationHistory(props.row)"
											aria-role="listitem">
										{{$t('crowdSourcingOperationsButtonHistory')}}
									</b-dropdown-item>
								</b-dropdown>
							</b-button-group>
						</b-table-column>
					</template>
				</b-table>
			</div>
		</div>
	</div>
</template>

<script>
	const conf = require('../conf.js')
	import ByteAmount from './commons/ByteAmount.vue'
	import ContestOperationModal from './commons/ContestOperationModal.vue'
	import ClaimGainModal from './commons/ClaimGainModal.vue'
	import CommitOperationModal from './commons/CommitModal.vue'
	import ViewUrlProofsModal from './commons/ViewUrlProofsModal.vue'
	import OperationHistoryModal from './commons/OperationHistoryModal.vue'
	import ContributorsGreeting from './commons/ContributorsGreeting.vue'

	import { ModalProgrammatic } from 'buefy'

	import Exchange from './commons/Exchange.vue'
	import WalletId from './commons/WalletId.vue'
	import moment from 'moment/src/moment'

	export default {
		components: {
			ByteAmount,
			ContestOperationModal,
			ClaimGainModal,
			Exchange,
			WalletId,
			ContributorsGreeting,
		},
		data () {
			return {
				clicked_item: null,
				pools: null,
				isSpinnerActive: true,
				currentPage: 1,
				totalRows: 0,
				sortBy: 'countdown_start',
				defaultSortDirection: 'desc',
				timerId: null,
				operations: [],
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
			commitOperation (clicked_item) {
				let operationItem = clicked_item
				ModalProgrammatic.open({
					parent: this,
					component: CommitOperationModal,
					hasModalCard: true,
					props: {operationItem},
				})
			},
			viewUrlProofs (clicked_item) {
				let operationItem = clicked_item
				ModalProgrammatic.open({
					parent: this,
					component: ViewUrlProofsModal,
					hasModalCard: true,
					props: {operationItem},
				})
			},
			operationHistory (clicked_item) {
				let operationItem = clicked_item
				ModalProgrammatic.open({
					parent: this,
					component: OperationHistoryModal,
					hasModalCard: true,
					props: {operationItem},
				})
			},
			getData () {
				this.axios.get('/api/operations').then((response) => {
					this.operations = []
					response.data.forEach((row) => {
						const operation = {}
						operation.status = row.status
						if (row.initial_outcome == 'in') {
							operation.outcome_yes_or_no = row.outcome == 'in' ? this.$t('crowdSourcingOperationsYes') : this.$t(
								'crowdSourcingOperationsNo')
						} else {
							operation.outcome_yes_or_no = row.outcome == 'out' ? this.$t('crowdSourcingOperationsYes') : this.$t(
								'crowdSourcingOperationsNo')
						}
						operation.outcome = row.outcome
						operation.isRemovingOperation = row.outcome == 'out'
						operation.initial_outcome = row.initial_outcome
						operation.staked_on_outcome = Number(row.staked_on_outcome)
						operation.total_staked = Number(row.total_staked)
						operation.wallet_id = Number(row.wallet_id)
						operation.exchange = row.exchange
						operation.key = row.key
						operation.url_proofs_by_outcome = row.url_proofs_by_outcome
						operation.countdown_start = row.countdown_start
						operation.staked_on_opposite = Number(row.staked_on_opposite)
						if ((new Date().getTime() / 1000 - row.countdown_start) > conf.challenge_period_in_days * 24 * 3600) {
							operation.is_commitable = true
							operation.end = this.$t('crowdSourcingOperationsTableEnded')
						} else {
							operation.end = moment().
							to(moment.unix(conf.challenge_period_in_days * 24 * 3600 + Number(row.countdown_start)))
						}

						if (operation.status == 'committed') {
							operation.claimAddresses = []
							const assocStakedByAdress = row.staked_by_address
							const outcome = row.outcome
							for (var key in assocStakedByAdress) {
								if (assocStakedByAdress[key][outcome])
									operation.claimAddresses.push(key)
							}
						}
						this.operations.push(operation)
						this.totalRows = this.operations.length
					})
					this.isSpinnerActive = false
				})

			},
		},
	}
</script>

<style lang="scss">
	#action {
		display: flex;
		align-items: center;
		& > span {
			margin: 0 5px;
		}
	}
	.btn-group {
		button {
			margin-right: 5px;
		}
	}
	.table-wrapper {
		td {
			vertical-align: middle;
		}
	}

</style>
