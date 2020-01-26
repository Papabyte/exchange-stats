<template>
	<div>
		<h3 class="title is-3 mb-2">{{$t('explorerWalletsForExchangeTitle', {exchange: exchangeName})}}</h3>
		<div class="box">

			<div class="columns">

				<div class="column">
					<span class="title is-5 mr-2">{{$t('explorerWalletsForExchangeSearchForBtcAddress')}} </span>
						<div class="field has-addons">
							<b-field
							:message = "text_error"
							:type="input_type">
								<b-input 
										placeholder="Search..."
										v-model="address_input"
										type="search"
										icon="magnify">
								</b-input>
							</b-field>
							<p class="control">
								<button class="button is-info" @click="searchAddress">{{$t('explorerWalletsForExchangeButtonSearch')}}</button>
							</p>
						</div>
					</div>
				</div>
				<div class="column" v-if="found_address_wallet">
					<div v-if="wallets[found_address_wallet]" ref="search-result">

					<span class="title is-5">{{$t('explorerWalletsForExchangeWalletBelongsToExchange', {address: searchedAddress, wallet: found_address_wallet, exchange: exchangeName})}} </span>
					</div>
					<div v-else ref="search-result">
						<span class="title is-5">
						<i18n class="vert-bottom" v-if="!isForAny" path="explorerWalletsForExchangeWalletDoesntBelongToExchange">
							<template #address>
								{{searchedAddress}}
							</template>
							<template #wallet>
								<wallet-id :id="found_address_wallet" />
							</template>
							<template #exchange>
								{{exchangeName}}
							</template>
						</i18n>
						</span>
					</div>
				</div>

			</div>

			<div class="box" v-for="(wallet,key) in wallets" :key="key">
				<div class="row" v-if="wallet.from_id && key != wallet.from_id">
					<div class="columns">
					<div class="column">
						<span class="title is-5 mr-2">{{$t('explorerWalletsForExchangeWalletWallet')}}</span>
						<wallet-id :id="Number(key)" />
					</div>
					<div class="column is-auto" />
						<div class="column">
							<div class="field has-addons">
								<span class="title is-5 mr-2">{{$t('explorerWalletsForExchangeRedirectedFrom')}}</span>
								<span class="control">
										<wallet-id :id="wallet.from_id" /> 
								</span>
								<span class="control">
									<b-tooltip type="is-info" :label="$t('explorerTransactionsButtonRemoveFromExchangeTip')">
										<b-button
												type="is-warning"
												icon-right="close"
												size="is-medium"
												@click="removeWalletFromExchange(wallet.from_id, request_input)"
										/>
									</b-tooltip>
								</span>
							</div>
						</div>
					</div>
				</div>
				<div class="row" v-else>
					<div class="row">
							<span class="title is-5 mr-2">Wallet:  </span>
						<wallet-id :id="key" />
					</div>
				</div>
				<div class="row" v-if="wallet.from_id">
					<span  class="title is-5">{{$t('explorerWalletsForExchangeBtcBalance')}}</span> 
					<span class="has-text-weight-medium"><btc-amount :amount="wallet.balance" /></span>
				</div>
				<div class="row" v-if="wallet.from_id">
					<span class="title is-5">{{$t('explorerWalletsForExchangeTotalAddresses')}}</span> 
						<router-link  :to="{name: 'explorerAddresses', params: { request_input: key} }">
							<span class="has-text-weight-medium">{{wallet.addr_count || 0}}</span>
						</router-link>
					
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
	import validate from 'bitcoin-address-validation'

	export default {
		mixins:[meta],
		components: {
			WalletId,
			BtcAmount,
		//	Exchange
		},
		props: {
			request_input: {
				type: String,
				required: true,
			}
		},
		data () {
			return {
				wallets: {},
				searchedAddress: null,
				address_input: null,
				text_error: null,
				input_type: null,
				found_address_wallet: null
			}
		},
		computed: {
			exchangeName: function () {
				return this.$store.state.exchangesById[this.request_input] ? this.$store.state.exchangesById[this.request_input].name : this.request_input
			},
		},
		created () {
			this.updateMeta()
			this.getWallets()
		},
		beforeDestroy () {

		},
		methods: {
			updateMeta () {
				this.setTitle(this.$t('explorerWalletsForExchangePageTitle',
					{ exchange: this.exchangeName, website_name: conf.website_name }))
				this.setMetaDescription(this.$t('explorerWalletsForExchangeMetaDescription', { exchange: this.exchangeName }))
				this.setRobotDirective('noindex')
			},
			getWallets () {
				console.log("getWallets")
				this.axios.get('/api/exchange-wallets-infos/' + this.request_input + '/').
				then((response) => {
					this.wallets = response.data
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
			searchAddress(){
				this.found_address_wallet = null
				this.text_error = null
				this.input_type = null
				if (!this.address_input) {
					return
				} else if (!validate(this.address_input)){
					this.text_error = "This is not a valid Bitcoin address"
					this.input_type = "is-danger"
				}	else {
				this.axios.get('/api/address/' + this.address_input).
					then((response) => {
							this.found_address_wallet = response.data.redirected_id
							this.searchedAddress = this.address_input
					})


				}


			}
		},
	}


</script>

<style lang="scss" scoped>

.vert-bottom *{
	vertical-align: bottom;
}

</style>
