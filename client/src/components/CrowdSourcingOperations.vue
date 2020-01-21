<template>

	<div class="container">
		<div class="full-height notification is-warning">
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
							<b-tag type="is-info">{{ props.row.status }}</b-tag>
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
							<b-tag :type="props.row.outcome_label_type">{{ props.row.outcome_yes_or_no }}</b-tag>
						</b-table-column>

						<b-table-column field="staked_on_outcome" :label="$t('crowdSourcingOperationsTableColStakedOnOutcome')"
														sortable>
							<byte-amount :amount="props.row.staked_on_outcome"/>
						</b-table-column>

						<b-table-column field="total_staked" :label="$t('crowdSourcingOperationsTableColTotalStaked')" sortable>
							<byte-amount :amount="props.row.total_staked"/>
						</b-table-column>

						<b-table-column field="end" :label="$t('crowdSourcingOperationsTableColEnd')" sortable>
							<b-tag v-if="!props.row.is_committable"  type="is-warning">{{ moment().to(props.row.end) }}</b-tag>
							<b-tag v-else  type="is-warning">{{ $t('crowdSourcingOperationsTableEnded') }}</b-tag>
						</b-table-column>

						<b-table-column class="btn-group" field="actions" :label="$t('crowdSourcingOperationsTableColAction')">

								<b-tooltip type="is-info" :label="$t('crowdSourcingOperationsButtonContestTip')">
									<b-button
											class="button is-info is-outlined"
											v-if="props.row.status == 'onreview' && !props.row.is_committable "
											v-on:click="contestOperation(props.row)">
										{{$t('crowdSourcingOperationsButtonContest')}}
									</b-button>
								</b-tooltip>

								<b-tooltip type="is-info" :label="$t('crowdSourcingOperationsButtonCommitTip')">
									<b-button
											class="button is-info is-outlined"
											v-if="props.row.status == 'onreview' && props.row.is_committable"
											@click="commitOperation(props.row)">
										{{$t('crowdSourcingOperationsButtonCommit')}}
									</b-button>
								</b-tooltip>

								<b-tooltip type="is-info" :label="$t('crowdSourcingOperationsButtonClaimTip')">
									<b-button
											class="button is-info is-outlined"
											v-if="props.row.status == 'committed' && props.row.claimAddresses.length>0"
											v-on:click="claimGain(props.row)">
											{{$t('crowdSourcingOperationsButtonClaim')}}
									</b-button>
								</b-tooltip>
								<b-tooltip type="is-info" :label="$t('crowdSourcingOperationsButtonViewProofsTip')">
									<b-button class="button is-info is-outlined"
											@click="viewUrlProofs(props.row)">
										{{$t('crowdSourcingOperationsButtonViewProofs')}}
									</b-button>
								</b-tooltip>
								<b-tooltip type="is-info" :label="$t('crowdSourcingOperationsButtonHistoryTip')">
									<b-button class="button is-info is-outlined"
											@click="viewOperationHistory(props.row)"
											aria-role="listitem">
										{{$t('crowdSourcingOperationsButtonHistory')}}
									</b-button>
								</b-tooltip>
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
				sortBy: 'end',
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
			moment: moment,
			contestOperation (clicked_item) {
				let operationItem = clicked_item
				ModalProgrammatic.open({
					parent: this,
					component: ContestOperationModal,
					hasModalCard: true,
					props: { operationItem },
				})
			},
			commitOperation (clicked_item) {
				let operationItem = clicked_item
				ModalProgrammatic.open({
					parent: this,
					component: CommitOperationModal,
					hasModalCard: true,
					props: { operationItem },
				})
			},
			claimGain (clicked_item) {
				let operationItem = clicked_item
				ModalProgrammatic.open({
					parent: this,
					component: ClaimGainModal,
					hasModalCard: true,
					props: { operationItem },
				})
			},
			viewUrlProofs (clicked_item) {
				let operationItem = clicked_item
				ModalProgrammatic.open({
					parent: this,
					component: ViewUrlProofsModal,
					hasModalCard: true,
					props: { operationItem },
				})
			},
			viewOperationHistory (clicked_item) {
				let operationItem = clicked_item
				ModalProgrammatic.open({
					parent: this,
					component: OperationHistoryModal,
					hasModalCard: true,
					props: { operationItem },
				})
			},
			getData () {
				this.axios.get('/api/operations').then((response) => {
					this.operations = []
					response.data.forEach((row) => {
						if (row.initial_outcome == 'in') {
							row.outcome_yes_or_no = row.outcome == 'in' ? this.$t('crowdSourcingOperationsYes') : this.$t(
								'crowdSourcingOperationsNo')
							row.outcome_label_type = row.outcome == 'in' ? 'is-success' : 'is-danger'
						} else {
							row.outcome_yes_or_no = row.outcome == 'out' ? this.$t('crowdSourcingOperationsYes') : this.$t(
								'crowdSourcingOperationsNo')
							row.outcome_label_type = row.outcome == 'out' ? 'is-success' : 'is-danger'
						}
						row.end = moment.unix(conf.challenge_period_in_days * 24 * 3600 + row.countdown_start)
						if ((new Date().getTime() / 1000 - row.countdown_start) > conf.challenge_period_in_days * 24 * 3600)
							row.is_committable = true
						if (row.status == 'committed') {
							row.claimAddresses = []
							const assocStakedByAdress = row.staked_by_address
							const outcome = row.outcome
							for (var key in assocStakedByAdress) {
								if (assocStakedByAdress[key][outcome])
									row.claimAddresses.push(key)
							}
						}
					})
					this.operations = response.data
					this.totalRows = this.operations.length
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
