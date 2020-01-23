<template>
	<b-dropdown aria-role="list"  @active-change="onClick">
		<button class="button is-info is-outlined" slot="trigger">
			<span>{{ $t('rankingTableButtonContribute') }}</span>
			<b-icon icon="menu-down"></b-icon>
		</button>
		<b-dropdown-item aria-role="listitem" @click="addAWallet(row.exchange_id)">
			<div>
				<div class="is-inline-block">	{{$t('rankingTableButtonAddWallet')}}</div>
				<div v-if="rewardAmount" class="is-inline-block ml-05"> - <byte-amount :amount="rewardAmount"  /> reward</div>
			</div>
		</b-dropdown-item>
		<b-dropdown-item 
			aria-role="listitem"
			v-if="row.total_btc_wallet || row.nb_withdrawal_addresses"
			@click="removeAWallet(row.exchange_id)">
			{{$t('rankingTableButtonRemoveWallet')}}
			<div v-if="rewardAmount" class="is-inline-block ml-05"> - <byte-amount :amount="rewardAmount"  /> reward</div>
		</b-dropdown-item>
		<b-dropdown-item v-for="operation in operationsToContest" 
			aria-role="listitem"
			:key="operation.operation_id"
			@click="contestOperation(operation)">
			<div>
				<div class="is-inline-block">{{getContestField(operation)}}</div>
				<div class="is-inline-block ml-05"> - <byte-amount :amount="operation.staked_on_outcome - operation.staked_on_opposite/conf.challenge_coeff"  /> </div>
			</div>
		</b-dropdown-item>
		<b-dropdown-item 
			aria-role="listitem"
			@click="donateReward(row.exchange_id)">
			{{$t('rankingTableButtonPostReward')}} 
		</b-dropdown-item>
	</b-dropdown>
</template>

<script>

	const conf = require('../conf.js')
	import { ModalProgrammatic } from 'buefy'
	import ContestOperationModal from './commons/ContestOperationModal.vue'
	import ByteAmount from './commons/ByteAmount.vue'
	import DonateRewardModal from './commons/DonateRewardModal.vue'
	import EditModalAddWallet from './commons/EditModalAddWallet.vue'
	import EditModalRemoveWallet from './commons/EditModalRemoveWallet.vue'

	export default {
		components: {
			ByteAmount
		},
		data () {
			return {
				rewardAmount: 0,
				operationsToContest: [],
				conf: conf
			}
		},
		props: {
			row: {
				type: Object,
				required: true,
			},
		},
		computed: {

		},
		created () {

		},
		methods: {
			getContestField: function(operation){
				if (operation.initial_outcome == 'in' && operation.outcome == 'in')
					return this.$t('rankingTableContributeContestFieldContestAdding', {wallet: operation.wallet_id})
				else if (operation.initial_outcome == 'out' && operation.outcome == 'out')
					return this.$t('rankingTableContributeContestFieldContestRemoving', {wallet: operation.wallet_id})
				else if (operation.initial_outcome == 'in' && operation.outcome == 'out')
					return this.$t('rankingTableContributeContestFieldConfirmAdding', {wallet: operation.wallet_id})
				else if (operation.initial_outcome == 'out' && operation.outcome == 'in')
					return this.$t('rankingTableContributeContestFieldConfirmRemoving', {wallet: operation.wallet_id})
				else
					return ''
			},
			onClick: function(isActive){
				if (isActive){
					this.axios.get('/api/pool/' + this.row.exchange_id).then((response) => {
						this.rewardAmount = response.data.reward_amount
					})

					this.axios.get('/api/pending-operations-for-exchange/' + this.row.exchange_id).then((response) => {
						this.operationsToContest = []
						response.data.forEach((row)=>{
							if (row.status != 'onreview')
								return
							if ((new Date().getTime() / 1000 - row.countdown_start) < conf.challenge_period_in_days * 24 * 3600)
								this.operationsToContest.push(row)
						});
					})
				} else {
					this.rewardAmount = 0
				}
			},
			addAWallet (exchange) {
				ModalProgrammatic.open({
					parent: this,
					component: EditModalAddWallet,
					hasModalCard: true,
					props: { propExchange: exchange},
				})
			},
			removeAWallet (exchange) {
				ModalProgrammatic.open({
					parent: this,
					component: EditModalRemoveWallet,
					hasModalCard: true,
					props: { propExchange: exchange},
				})
			},
			contestOperation (operation) {
				ModalProgrammatic.open({
					parent: this,
					component: ContestOperationModal,
					hasModalCard: true,
					props: { operationItem: operation },
				})
			},
			donateReward (exchange) {
				ModalProgrammatic.open({
					parent: this,
					component: DonateRewardModal,
					hasModalCard: true,
					props: { propExchange: exchange },
				})
			},
		}
	}
</script>

<style scoped>
	.section {
		padding: 2rem 1.5rem;
	}

</style>
