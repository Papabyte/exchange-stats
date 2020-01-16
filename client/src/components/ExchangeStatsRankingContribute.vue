<template>
	<b-dropdown aria-role="list"  @active-change="onClick">
		<button class="button is-info is-outlined" slot="trigger">
			<span>{{ $t('rankingTableButtonContribute') }}</span>
			<b-icon icon="menu-down"></b-icon>
		</button>
		<b-dropdown-item aria-role="listitem" @click="addAWallet(row.exchange_id)">
			{{$t('rankingTableButtonAddWallet')}}
			<div v-if="rewardAmount"><byte-amount :amount="rewardAmount" /></div>
		</b-dropdown-item>
		<b-dropdown-item aria-role="listitem"
											v-if="row.total_btc_wallet || row.nb_withdrawal_addresses"
											@click="removeAWallet(row.exchange_id)">
			{{$t('rankingTableButtonRemoveWallet')}} - {{ row.exchange_id }}
		</b-dropdown-item>
	</b-dropdown>
</template>

<script>

	const conf = require('../conf.js')
	import { ModalProgrammatic } from 'buefy'
	import EditWalletModal from './commons/EditWalletModal.vue'
	import ByteAmount from './commons/ByteAmount.vue'

	export default {
		components: {
ByteAmount
		},
		data () {
			return {
				rewardAmount: 100000
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

			onClick: function(isActive){
				if (isActive){
					this.axios.get('/api/pool/' + this.row.exchange_id).then((response) => {
						this.rewardAmount = response.data.reward_amount
					})

					this.axios.get('/api/pending-operations-for-exchange/' + this.row.exchange_id).then((response) => {

						console.log(response.data)
					})


				} else {
					this.rewardAmount = 0
				}

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
		}
	}
</script>

<style scoped>
	.section {
		padding: 2rem 1.5rem;
	}

</style>
