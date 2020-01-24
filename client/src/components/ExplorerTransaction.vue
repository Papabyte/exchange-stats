<template>
	<div :class="{bordered: !no_border}" class="row mb-1">
		<div class="full-height notification columns transaction-headers is-paddingless">
			<div class="column is-9">
				<TxId label="Transaction: " :tx_id="tx_id"/>
			</div>
			<div class="column is-3">
				<div class="full-height notification">
					<span class="title is-6">Time: </span>
					<span class="title is-5 is-marginless">{{transaction.time}}</span>
				</div>
			</div>
		</div>
		<div class="columns is-marginless">
			<div class="column is-3">
				<div class="columns is-multiline">
					<div class="column">
						<wallet-id v-if="transaction.from && transaction.from.id" :label="$t('explorerTransactionLabelWallet')"
											 :id="transaction.from.id"/>
					</div>
					<div class="column" v-if="transaction.from.exchange">
						<exchange :label="$t('explorerTransactionLabelExchange')" :id="transaction.from.exchange"/>
					</div>
				</div>
				<div class="mt-1">
					<btc-amount v-if="transaction.from && transaction.from.amount" :label="$t('explorerTransactionLabelAmount')"
											:amount="transaction.from.amount" :isNegative="about_ids.indexOf(transaction.from.id)>-1"/>
				</div>
			</div>
			<div class="column is-1">
				<div class="centered">
					<v-icon name='arrow-right' class="custom-icon"/>
				</div>
			</div>
			<div class="column destination">
				<div v-for="(t_out,index) in transaction.to" :key="index" class="columns fw-w">
					<div class="column is-4">
						<wallet-id v-if="t_out.id" label="Wallet: " :id="t_out.id"/>
						<span v-else>
							<div class="button is-warning is-unknown">
								{{$t('explorerTransactionUnknownWallet')}}
							</div>
						</span>
					</div>
					<div class="column is-4" v-if="t_out.exchange">
						<exchange :label="$t('explorerTransactionLabelExchange')" :id="t_out.exchange"/>
					</div>
					<div class="column is-4">
						<btc-amount :label="$t('explorerTransactionLabelAmount')" :amount="t_out.amount"
												:isPositive="about_ids.indexOf(t_out.id)>-1"/>
					</div>
					<div class="row pn-75">
						<div class="columns">
							<div class="column ">
								<btc-address v-if="t_out.address" :label="$t('explorerTransactionLabelAddress')"
														 :address="t_out.address"/>
							</div>
						</div>
					</div>
				</div>
				<div v-if="transaction.expandable_rows" class="py-2">
					<b-button
							type="is-light"
							size="is-medium"
							icon-left="arrow-expand-down"
							@click="loadMore(tx_id)"
					>
						Expand {{transaction.expandable_rows}} more outputs
					</b-button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	//commons
	import BtcAmount from './commons/BtcAmount.vue'
	import WalletId from './commons/WalletId.vue'
	import TxId from './commons/TxId.vue'
	import BtcAddress from './commons/BtcAddress.vue'
	import Exchange from './commons/Exchange.vue'

	export default {
		components: {
			BtcAmount,
			WalletId,
			TxId,
			BtcAddress,
			Exchange,
		},
		props: ['transaction', 'tx_id', 'no_border', 'about_wallet_ids'],
		data () {
			return {
				about_ids: this.about_wallet_ids || [],
				isExpandable: false,
			}
		},
		methods: {
			loadMore (tx_id) {
				this.$emit('expand', tx_id)
			},
		},
	}
</script>

<style lang="scss" scoped>
	.bordered {
		/*border-bottom: 2px solid gainsboro;*/
	}

	.destination {
		.columns {
			border-top: 1px dashed rgb(80, 79, 79);

			&:first-child {
				border-top: 0
			}
		}
	}

	.custom-icon {
		height: 50px;
		padding: auto;
	}

	.centered {
		display: flex;
		/*align-items: center;*/
		justify-content: center;
		height: 100%;
	}

	.transaction-headers {
		background-color: gainsboro
	}
</style>
