<template>
	<div>
		<h3 class="title is-3 mb-2">{{$t('explorerAddressesAddressesInWallet',{wallet: request_input})}}</h3>
		<div class="box">
			<div v-if="count_total" class="d-flex ai-center">
				<h5 class="title is-5 d-inline-block is-marginless mr-05">
					{{$t('explorerAddressesCountInWallet',{count:count_total})}}</h5>
				<wallet-id :id="Number(request_input)"/>
			</div>
				<div class="row" v-if="walletOwner">
					<h5 class="title is-5">{{$t('explorerAddressesBelongTo')}}</h5>
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
		</div>

		<div class="box" v-if="!isSpinnerActive">
	
			<div class="row mb-2">
				<b-pagination
						:total="count_total"
						:current.sync="currentPage"
						:per-page="perPage"
						range-before="3"
						range-after="3"
						@change="onPageChanged"
						aria-next-label="Next page"
						aria-previous-label="Previous page"
						aria-page-label="Page"
						aria-current-label="Current page">
				</b-pagination>
			</div>

			<div class="notification columns transaction-headers is-paddingless is-marginless">
				<div class="column is-4">
					<span class="title is-6">{{$t('explorerAddressesTableHeaderAddress')}}</span>
				</div>
				<div class="column is-4">
					<span class="title is-6">{{$t('explorerAddressesTableHeaderBalance')}}</span>
				</div>
				<div class="column is-4">
					<span class="title is-6">{{$t('explorerAddressesTableHeaderViewOn')}}</span>
				</div>
			</div>
			<div class="addr-list" v-for="(address,index) in addresses" v-bind:key="index">
				<div class="columns">
					<div class="column">{{address.address}}</div>
						<div class="column"><btc-amount :amount="address.balance"/></div>
						<div class="column"><a :href="'https://blockstream.info/address/' + address.address">blockstream.info</a></div>
				</div>
			</div>
		</div>
		<div v-else class="box">
			<div class="container">
				<b-loading label="Spinning" :is-full-page="true" :active.sync="isSpinnerActive"
									 :can-cancel="true"></b-loading>
			</div>
		</div>
	</div>
</template>

<script>

	const conf = require('../conf.js')
	import WalletId from './commons/WalletId.vue'
	import BtcAmount from './commons/BtcAmount.vue'
	import Exchange from './commons/Exchange.vue'
	import EditModalRemoveWallet from './commons/EditModalRemoveWallet.vue'
	import { ModalProgrammatic } from 'buefy'
	import meta from '../mixins/meta'

	export default {
		mixins:[meta],
		components: {
			WalletId,
			BtcAmount,
			Exchange
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
				addresses: [],
				isSpinnerActive: true,
				perPage: 100,
				walletOwner: null,
				wallet_id: Number(this.request_input)
			}
		},
		watch: {
			$route (route) {
				this.currentPage = this.page || 1
				this.getAddresses()
			},
		},
		created () {
			this.currentPage = this.page || 1
			this.getAddresses()
		},
		beforeDestroy () {
			clearInterval(this.timerId)
		},
		methods: {
			updateMeta () {
				this.setTitle(this.$t('explorerAddressesPageTitle',
					{ wallet: this.wallet_id, website_name: conf.website_name }))
				if (this.walletOwner){
					this.setMetaDescription(this.$t('explorerAddressesMetaDescriptionWithExchange', { 
						number: this.count_total, 
						wallet: this.wallet_id,  
						exchange: this.$store.state.exchangesById[this.walletOwner].name
					}))
					if(this.page == 1)
						this.setRobotDirective('nofollow')
					else
						this.setRobotDirective('none')
				}
				else {
					this.setMetaDescription(this.$t('explorerAddressesMetaDescription', { number: this.count_total, wallet: this.wallet_id }))
					this.setRobotDirective('none')
				}
			},
			onPageChanged (value) {
				this.$router.push({ name: 'explorerAddressesPaged', params: { url_input: this.wallet_id, page: value } })
			},
			getAddresses () {
				this.isSpinnerActive = true
				this.count_total = null
				this.axios.get('/api/wallet-addresses/' + this.wallet_id + '/' + (this.currentPage - 1)).
				then((response) => {
					this.addresses = response.data.addresses
					this.walletOwner = response.data.exchange
					this.count_total = Number(response.data.addr_count)
					this.isSpinnerActive = false
					this.updateMeta()
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
		},
	}


</script>

<style lang="scss" scoped>
	.transaction-headers {
		background-color: gainsboro
	}

	.notification {
		margin-bottom: 1rem !important;
	}

	.addr-list {
		margin-bottom: 1rem;
		border-radius: 4px;
		padding: 1rem;
		background: whitesmoke;
	}
</style>
