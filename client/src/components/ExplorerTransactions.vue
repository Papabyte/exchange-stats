<template>
	<div class="section">

		<div class="container" v-if="blockTitle">
			<h3 class="title is-3 mb-2">{{ blockTitle }}</h3>
		</div>
		<!--		<edit-wallet-modal :propExchange="exchange || walletOwner" :propWalletId="walletIdToEdit" :isRemoving="isRemoving"/>-->

		<div class="container">
			<div v-if="!isSpinnerActive">
				<div>
					<div>
						<div class="text-center" v-if="failoverText">
							{{failoverText}}
						</div>

						<div class="text-center" v-if="walletOwner">
							<span class="pr-2">{{$t('explorerTransactionsBelongsTo')}}</span>
							<Exchange :id="walletOwner"/>
							<span class="test3">
								<b-button
										v-if="wallet_id"
										type="is-warning"
										@click="isRemoving=true;walletIdToEdit=wallet_id;$bvModal.show('editWallet');"
										class="ml-2 button-xs"
										v-b-tooltip.hover
										:title="$t('explorerTransactionsButtonRemoveFromExchangeTip')"
								>
								<v-icon name='x' class="x-icon"/>
							</b-button>
							</span>
						</div>

						<div v-if="wallet_id&&!walletOwner">
							<span class="test1">
								<b-button type="is-warning" @click="editWallet(null)">
								{{$t('explorerTransactionsButtonAddToExchange')}}
							</b-button>
							</span>
						</div>

						<div v-if="exchangeWallets">
							{{$t('explorerTransactionsWalletsForExchange')}}
							<div class="pl-3" align-h="start">
								<div v-for="(wallet,index) in exchangeWallets" v-bind:key="index">
									<div>
										<wallet-id :id="Number(wallet)"/>
										<span class="test2">
											<b-button
													type="is-warning"
													@click="isRemoving=true;walletIdToEdit=Number(wallet);$bvModal.show('editWallet');"
													v-b-tooltip.hover
													:title="$t('explorerTransactionsButtonRemoveFromExchangeTip')"
													class="ml-2 button-xs">
											<v-icon name='x' class="x-icon"/>
										</b-button>
										</span>
									</div>
								</div>
							</div>
						</div>

						<div class="text-center" v-if="total_on_wallets">
							<span class="pr-1">{{$t('explorerTransactionsTotalOnWallet')}}</span>
							<btc-amount :amount="total_on_wallets"/>
						</div>

						<div v-if="count_total">
							{{$t('explorerTransactionsTotalTransactions')}}{{count_total}}
						</div>
						<div v-if="wallet_id">
							<span class="pr-1">{{$t('explorerTransactionsAddressCount')}}</span>
							<router-link :to="{name: 'explorerAddresses', params: { request_input: wallet_id} }">
								{{addr_count}}
							</router-link>
						</div>
					</div>
					<div cols="2" v-if="exchange" class="float-right test4">
						<b-button
								type="is-warning"
								@click="isRemoving=false;walletIdToEdit=null;$bvModal.show('editWallet');">
							{{$t('explorerTransactionsButtonAddWallet')}}
						</b-button>
					</div>
				</div>
			</div>
			<div v-else>
				<div class="text-center w-100">
					<b-spinner label="Spinning"></b-spinner>
				</div>
			</div>
		</div>

		<div v-if="!isSpinnerActive && transactions">
			<div offset-lg="1" lg="10" cols="12" class="py-3 main-block">
				<div class="text-center">
					<b-pagination
							v-model="currentPage"
							:total-rows="count_total"
							per-page="20"
							@change="onPageChanged"
							size="l"
							class="pl-4 pt-2 my-0"
					></b-pagination>
					<div class="w-100" v-for="(transaction,key,index) in transactions" v-bind:key="key">
						<transaction v-if="progressive_display_level>index" :tx_id="key" :transaction="transaction"
												 :no_border="index == (Object.keys(transactions).length-1)" :about_wallet_ids="redirected_ids"/>
					</div>
				</div>
			</div>
		</div>

		<div v-if="!isSpinnerActive && transactions">
			<div offset-lg="1" lg="10" cols="12" class="py-3 main-block">
				<div class="text-center">
					<b-pagination
							v-model="currentPage"
							:total-rows="count_total"
							per-page="20"
							@change="onPageChanged"
							size="l"
							class="pl-4 pt-2 my-0"
					></b-pagination>
					<div class="w-100" v-for="(transaction,key,index) in transactions" v-bind:key="key">
						<transaction v-if="progressive_display_level>index" :tx_id="key" :transaction="transaction"
												 :no_border="index == (Object.keys(transactions).length-1)" :about_wallet_ids="redirected_ids"
												 @expand="expand_tx"/>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	import Transaction from './ExplorerTransaction.vue'
	import validate from 'bitcoin-address-validation'
	import EditWalletModal from './commons/EditWalletModal.vue'
	import Exchange from './commons/Exchange.vue'
	import BtcAmount from './commons/BtcAmount.vue'
	import WalletId from './commons/WalletId.vue'
	import { ModalProgrammatic } from 'buefy'

	const conf = require('../conf.js')

	export default {
		components: {
			Transaction,
			// EditWalletModal,
			Exchange,
			BtcAmount,
			WalletId,
		},
		props: {
			request_input: {
				type: String,
				required: true,
			},
			page: {
				type: Number || String,
				required: false,
				default: 1,
			},
		},
		data () {
			return {
				transactions: null,
				count_total: null,
				exchangeName: null,
				exchange: null,
				wallet_id: null,
				exchangeWallets: null,
				title: null,
				isSpinnerActive: true,
				failoverText: null,
				redirected_ids: [],
				isRemoving: null,
				walletOwner: null,
				walletIdToEdit: null,
				tx_id: null,
				total_on_wallets: null,
				addr_count: null,
				progressive_display_level: 1,
				timerId: null,
			}
		},
		watch: {
			$route (route) {
				this.currentPage = this.page || 1
				this.getTransactions()
			},
		},
		created () {
			this.currentPage = this.page || 1
			this.getTransactions()
			this.timerId = setInterval(() => {
				this.progressive_display_level++
			}, 200)
		},
		beforeDestroy () {
			clearInterval(this.timerId)
		},
		methods: {
			editWallet (num) {
				let walletIdToEdit = num
				ModalProgrammatic.open({
					parent: this,
					component: EditWalletModal,
					hasModalCard: true,
					props: { walletIdToEdit, isRemoving: false },
				})
			},
			updateTitleAndDescription () {
				if (this.wallet_id) {
					document.title = this.$t('explorerTransactionsPageTitleWalletId', {
						wallet_id: this.wallet_id,
						website_name: conf.website_name,
					})

					if (this.walletOwner)
						var description = this.$t('explorerTransactionsMetaDescriptionWalletIdWithOwner', {
							wallet_id: this.wallet_id,
							exchange: this.walletOwner,
						})
					else
						var description = this.$t('explorerTransactionsMetaDescriptionWalletId', { wallet_id: this.wallet_id })
				} else if (this.tx_id) {
					document.title = this.$t('explorerTransactionsPageTitleTxId', {
						tx_id: this.tx_id,
						website_name: conf.website_name,
					})
					var description = this.$t('explorerTransactionsMetaDescriptionTxId', { tx_id: this.tx_id })
				} else if (this.exchangeName) {
					document.title = this.$t('explorerTransactionsPageExchange', {
						exchange: this.exchangeName,
						website_name: conf.website_name,
					})
					var description = this.$t('explorerTransactionsMetaDescriptionExchange', { exchange: this.exchangeName })
				}
				document.getElementsByName('description')[0].setAttribute('content', description)
			},
			onPageChanged (value) {
				this.$router.push({ name: 'explorerInputPaged', params: { url_input: this.request_input, page: value } })
			},
			getTransactions () {
				this.isSpinnerActive = true
				this.transactions = null
				this.count_total = null
				this.exchangeName = null
				this.exchangeWallets = null
				this.exchange = null
				this.blockTitle = null
				this.failoverText = null
				this.redirected_ids = []
				this.wallet_id = null
				this.walletOwner = null
				this.walletIdToEdit = null
				this.total_on_wallets = null
				this.tx_id = null
				this.addr_count = null

				if (Number(this.request_input)) { // it's a wallet id
					this.blockTitle = this.$t('explorerTransactionsTransactionsForWallet') + this.request_input
					this.axios.get('/api/wallet/' + this.request_input + '/' + (this.currentPage - 1)).then((response) => {
						this.progressive_display_level = 1
						this.blockTitle = this.$t('explorerTransactionsTransactionsForWallet') + response.data.redirected_id
						if (response.data.txs) {
							this.transactions = response.data.txs.txs
							this.count_total = response.data.txs.count_total
							this.redirected_ids = [response.data.redirected_id]
							this.total_on_wallets = response.data.txs.total_on_wallets
							this.addr_count = response.data.txs.addr_count
						} else {
							this.failoverText = this.$t('explorerTransactionsNoTransactionsFound') + this.request_input
						}
						this.wallet_id = Number(response.data.redirected_id)
						this.walletIdToEdit = this.wallet_id
						this.walletOwner = response.data.exchange
						this.isSpinnerActive = false
						this.updateTitleAndDescription()
					})
				} else if (isTxId(this.request_input)) { // it's a tx id
					this.blockTitle = 'Transaction ' + this.request_input
					this.tx_id = this.request_input
					this.axios.get('/api/txid/' + this.request_input).then((response) => {
						if (response.data.txs) {
							this.transactions = response.data.txs
							this.count_total = null
							this.isSpinnerActive = false
						} else {
							this.failoverText = this.$t('explorerTransactionsTransactionsNotFound',
								{ transaction: this.request_input })
						}
						this.updateTitleAndDescription()
					})

				} else if (validate(this.request_input)) { // it's a BTC address
					this.blockTitle = this.$t('explorerTransactionsLookingForWallet', { address: this.request_input })
					this.axios.get('/api/address/' + this.request_input).then((response) => {
						this.$router.push({ name: 'explorerInputPaged', params: { url_input: response.data.redirected_id } })
					})

				} else if (this.request_input) { // should be an exchange
					this.axios.get('/api/exchange/' + this.request_input + '/' + (this.currentPage - 1)).then((response) => {
						this.progressive_display_level = 1
						this.blockTitle = this.$t('explorerTransactionsTransactionsForExchange', { exchange: response.data.name })
						if (response.data.txs) {
							this.transactions = response.data.txs.txs
							this.count_total = response.data.txs.count_total
							this.exchangeWallets = response.data.wallet_ids
							this.redirected_ids = response.data.redirected_ids
							this.total_on_wallets = response.data.txs.total_on_wallets
						} else if (response.data.wallet_ids.length == 0) {
							this.failoverText = this.$t('explorerTransactionsNoWalletKnown', { exchange: response.data.name })
						} else {
							this.failoverText = this.$t('explorerTransactionsNoTransactionFound', { exchange: response.data.name })
						}
						this.exchange = this.request_input
						this.exchangeName = response.data.name
						this.isSpinnerActive = false
						this.updateTitleAndDescription()
					})
				}
			},
			expand_tx (tx_id) {
				this.axios.get('/api/txid/' + tx_id).then((response) => {

					this.transactions[tx_id] = response.data.txs[tx_id]
					console.log(response.data.txs)
				})
			},
		},
	}

	function isTxId (hex) {
		return (typeof hex === 'string' && hex.length === 64 && hex === (new Buffer(hex, 'hex')).toString('hex'))
	}

</script>

<style>
	.x-icon {
		height: 20px;
		width: 20px;
		margin-left: -8px;
		margin-top: -10px;
	}

	.button-xs {
		height: 30px;
		width: 30px;
	}
</style>
