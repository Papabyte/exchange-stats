<template>
	<div class="section">

		<div class="container" v-if="blockTitle">
			<h3 class="title is-3 mb-2">{{ blockTitle }}</h3>
		</div>
		<div class="container test">
			<div v-if="!isSpinnerActive" class="box">

				<div class="text-center" v-if="failoverText">
					{{failoverText}}
				</div>

				<div class="row mt-1" v-if="!wallet_id&&exchange&&!exchangeWallets">
					<b-button
							size="is-medium"
							type="is-warning"
							icon-left="plus"
							@click="addAWalletToExchange(exchange)"
					>
						{{$t('explorerTransactionsButtonAddWallet')}}
					</b-button>
				</div>
				<div class="row" v-if="walletOwner">
					<h5 class="title is-5">{{$t('explorerTransactionsBelongsTo')}}</h5>
					<div class="field has-addons">
						<span class="control">
							<Exchange :id="walletOwner"/>
						</span>
						<span class="control">
							<b-tooltip type="is-info" :label="$t('explorerTransactionsButtonRemoveFromExchangeTip')">
								<b-button
										v-if="wallet_id"
										type="is-warning"
										icon-right="close"
										size="is-medium"
										@click="removeWalletFromExchange(wallet_id, walletOwner)"
								/>
							</b-tooltip>
						</span>
					</div>
				</div>

				<div class="row" v-if="wallet_id&&!walletOwner">
					<b-button
							size="is-medium"
							type="is-warning"
							icon-left="plus"
							@click="addWalletToAnExchange(wallet_id)">
						{{$t('explorerTransactionsButtonAddToExchange')}}
					</b-button>
				</div>

				<div class="row" v-if="exchangeWallets">
					<h5 class="title is-5">{{$t('explorerTransactionsWalletsForExchange')}}</h5>
					<div class="columns">
						<div class="column">
							<span class="wallet-wrapper" v-for="(wallet,index) in exchangeWallets" v-bind:key="index">
								<div class="field has-addons">
									<span class="control">
										<wallet-id :id="Number(wallet)"/>
									</span>
									<span class="control">
										<b-tooltip type="is-info" :label="$t('explorerTransactionsButtonViewProofsTip')">
											<b-button
													type="is-warning"
													icon-right="magnify"
													size="is-medium"
													@click="viewAddingUrlProofs(wallet, exchange)"
											/>
										</b-tooltip>
									</span>
									<span class="control">
										<b-tooltip type="is-info" :label="$t('explorerTransactionsButtonRemoveFromExchangeTip')">
											<b-button
													type="is-warning"
													icon-right="close"
													size="is-medium"
													@click="removeWalletFromExchange(wallet, exchange)"
											/>
										</b-tooltip>
									</span>
								</div>
								<div class="is-inline" v-if="redirections_from[wallet]">
								{{$t('explorerTransactionsRedirectedTo')}}<wallet-id :id="Number(redirections_from[wallet])" />
								</div>
							</span>
						</div>
						<div class="column has-text-right" v-if="exchange">
							<b-button
									size="is-medium"
									type="is-warning"
									icon-left="plus"
									@click="addAWalletToExchange(exchange)"
							>
								{{$t('explorerTransactionsButtonAddWallet')}}
							</b-button>
						</div>
					</div>
				</div>

				<div class="row" v-if="total_on_wallets">
					<span v-if="exchange" class="title is-5">{{$t('explorerTransactionsTotalOnWallets')}}</span>
					<span v-if="wallet_id"  class="title is-5">{{$t('explorerTransactionsTotalOnWallet')}}</span>
					<btc-amount :amount="total_on_wallets"/>
				</div>

				<div class="row" v-if="count_total">
					<span class="title is-5">{{$t('explorerTransactionsTotalTransactions')}}</span>
					<span class="has-text-weight-medium">{{count_total == 'over_10000' ? 'more than 10000' : count_total}}</span>
				</div>

				<div class="row" v-if="wallet_id || exchange">
					<span class="title is-5">{{$t('explorerTransactionsAddressCount')}}</span>
						<router-link v-if="wallet_id" :to="{name: 'explorerAddresses', params: { request_input: wallet_id} }">
							<span class="has-text-weight-medium">{{addr_count || 0}}</span>
						</router-link>
							<span v-if="exchange" class="has-text-weight-medium">{{addr_count || 0}}</span>
				</div>
			</div>
			<div v-else class="box">
				<div class="container">
					<b-loading label="Spinning" :is-full-page="true" :active.sync="isSpinnerActive"
										 :can-cancel="true"></b-loading>
				</div>
			</div>
		</div>
		<div class="container">
			<br>
		</div>
		<div v-if="!isSpinnerActive && transactions" class="box">
			<div class="row mb-2">
				<b-pagination
						:total="total_txs_displayed"
						:current.sync="currentPage"
						:per-page="per_page"
						range-before="3"
						range-after="3"
						@change="onPageChanged"
						aria-next-label="Next page"
						aria-previous-label="Previous page"
						aria-page-label="Page"
						aria-current-label="Current page">
				</b-pagination>
			</div>
			<div class="container" v-for="(transaction,key,index) in transactions" v-bind:key="key">
				<transaction 
					v-if="progressive_display_level>index" 
					:tx_id="key" 
					:transaction="transaction"
					:no_border="index == (Object.keys(transactions).length-1)" :about_wallet_ids="redirected_ids"
					@expand="expand_tx"
				/>
			</div>
		</div>
	</div>
</template>

<script>
	import Transaction from './ExplorerTransaction.vue'
	import validate from 'bitcoin-address-validation'
	import EditModalAddExchange from './commons/EditModalAddExchange.vue'
	import EditModalAddWallet from './commons/EditModalAddWallet.vue'
	import EditModalRemoveWallet from './commons/EditModalRemoveWallet.vue'

	import Exchange from './commons/Exchange.vue'
	import BtcAmount from './commons/BtcAmount.vue'
	import WalletId from './commons/WalletId.vue'
	import ViewAddingUrlProofs from './commons/ViewUrlProofForAddingModal.vue'
	import meta from '../mixins/meta'

	import { ModalProgrammatic } from 'buefy'

	const conf = require('../conf.js')

	export default {
		mixins:[meta],
		components: {
			Transaction,
			Exchange,
			BtcAmount,
			WalletId
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
				walletOwner: null,
				tx_id: null,
				total_on_wallets: null,
				addr_count: null,
				progressive_display_level: 1,
				timerId: null,
				redirections_from: {},
				per_page: 20,
			}
		},
	computed:{
		total_txs_displayed:function(){
			if (typeof this.count_total == 'string' || this.count_total > this.txs_displayed)
				return this.txs_displayed
			else
			return this.count_total
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
			updateMeta () {
				if (this.exchangeName) {
					this.setTitle(this.$t('explorerTransactionsPageExchange',
						{ exchange: this.exchangeName, website_name: conf.website_name }))
					this.setMetaDescription(this.$t('explorerTransactionsMetaDescriptionExchange', { exchange: this.exchangeName }))
					if (this.currentPage == 1)
						this.setRobotDirective('nofollow')
					else
						this.setRobotDirective('none')
				} else if (this.tx_id) {
					this.setTitle(this.$t('explorerTransactionsPageTitleTxId',
						{ exchange: this.exchangeName, website_name: conf.website_name }))
					this.setMetaDescription(this.$t('explorerTransactionsMetaDescriptionTxId', { wallet_id: this.wallet_id }))
					this.setRobotDirective('nofollow')
 				} else if (this.wallet_id && this.walletOwner) {
					this.setTitle(this.$t('explorerTransactionsPageTitleWalletId',
						{ wallet_id: this.wallet_id, website_name: conf.website_name }))
					this.setMetaDescription(this.$t('explorerTransactionsMetaDescriptionWalletIdWithOwner', { 
						exchange: this.$store.state.exchangesById[this.walletOwner].name, 
						wallet_id: this.wallet_id,
					}))
					if (this.currentPage == 1)
						this.setRobotDirective('nofollow')
					else
						this.setRobotDirective('none')
				} else if (this.wallet_id) {
					this.setTitle(this.$t('explorerTransactionsPageTitleWalletId',
						{ wallet_id: this.wallet_id, website_name: conf.website_name }))
					this.setMetaDescription(this.$t('explorerTransactionsMetaDescriptionWalletId', { wallet_id: this.wallet_id }))
					this.setRobotDirective('none')
				}
			},
			addWalletToAnExchange(walletId) {
				ModalProgrammatic.open({
					parent: this,
					component: EditModalAddExchange,
					hasModalCard: true,
					props: { propWalletId: walletId },
				})
			},
			removeWalletFromExchange (walletId, exchange) {
				ModalProgrammatic.open({
					parent: this,
					component: EditModalRemoveWallet,
					hasModalCard: true,
					props: { propExchange: exchange, propWalletId: walletId },
				})
			},
			addAWalletToExchange (exchange) {
				ModalProgrammatic.open({
					parent: this,
					component: EditModalAddWallet,
					hasModalCard: true,
					props: { propExchange: exchange },
				})
			},
			viewAddingUrlProofs (walletId,exchange) {
				ModalProgrammatic.open({
					parent: this,
					component: ViewAddingUrlProofs,
					hasModalCard: true,
					props: {propExchange: exchange, propWalletId: walletId },
				})
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
				this.total_on_wallets = null
				this.tx_id = null
				this.addr_count = null
				this.redirections_from = {}

				if (Number(this.request_input)) { // it's a wallet id
					this.blockTitle = this.$t('explorerTransactionsTransactionsForWallet') + this.request_input
					this.axios.get('/api/wallet/' + this.request_input + '/' + (this.currentPage - 1)).then((response) => {
						this.progressive_display_level = 1
						const redirected_id = Number(Object.keys(response.data.redirections_from)[0])
						this.blockTitle = this.$t('explorerTransactionsTransactionsForWallet') + redirected_id
						if (response.data.txs) {
							this.transactions = response.data.txs.txs
							this.count_total = response.data.txs.count_total
							this.per_page = response.data.txs.per_page
							this.txs_displayed = response.data.txs.txs_displayed
							this.redirected_ids = Object.keys(response.data.redirections_from)
							this.redirections_from = response.data.redirections_from
							this.total_on_wallets = response.data.txs.total_on_wallets
							this.addr_count = response.data.txs.addr_count
						} else {
							this.failoverText = this.$t('explorerTransactionsNoTransactionsFound') + this.request_input
						}
						this.wallet_id = redirected_id
						this.walletOwner = response.data.exchange
						this.isSpinnerActive = false
						this.updateMeta()
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
						this.updateMeta()
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
							this.per_page = response.data.txs.per_page
							this.txs_displayed = response.data.txs.txs_displayed
							this.exchangeWallets = response.data.wallet_ids
							this.redirected_ids = Object.keys(response.data.redirections_from)
							this.redirections_from = response.data.redirections_from
							this.total_on_wallets = response.data.txs.total_on_wallets
							this.addr_count = response.data.txs.addr_count
						} else if (response.data.wallet_ids.length == 0) {
							this.failoverText = this.$t('explorerTransactionsNoWalletKnown', { exchange: response.data.name })
						} else {
							this.failoverText = this.$t('explorerTransactionsNoTransactionFound', { exchange: response.data.name })
						}
						this.exchange = this.request_input
						this.exchangeName = response.data.name
						this.isSpinnerActive = false
						this.updateMeta()
					})

				}

			},
			expand_tx (tx_id) {
				this.axios.get('/api/txid/' + tx_id).then((response) => {
					this.transactions[tx_id] = response.data.txs[tx_id]
				})
			},
		},
	}

	function isTxId (hex) {
		return (typeof hex === 'string' && hex.length === 64 && hex === (new Buffer(hex, 'hex')).toString('hex'))
	}

</script>

<style lang="scss">
	.wallet-wrapper {
		display: inline-block;
		margin-left: 15px;

		&:first-child {
			margin-left: 0;
		}
	}

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
