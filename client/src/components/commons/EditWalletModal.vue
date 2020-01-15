<template>
	<div class="modal-card add-wallet">
		<header class="modal-card-head">
			<p class="modal-card-title">{{ this.getTitle }}</p>
			<button class="delete" aria-label="close" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="container" v-show="!link">

				<div class="row" v-if="!propExchange && !isRemoving">
					<b-field :label="$t('editModalSelectExchange')">
						<b-autocomplete
								v-model="key"
								@input="onExchangeInput"
								:keep-first="false"
								:open-on-focus="true"
								:data="filteredDataObj"
								field="key">
							<template slot-scope="props">
								<b>{{ props.option.value }}</b>
								<br>
								<small>
									{{ props.option.key }}
								</small>
							</template>
						</b-autocomplete>
					</b-field>
				</div>

				<div class="row" v-if="!propWalletId && !isRemoving">
					<b-input
							v-on:input="onWalletInputChanged"
							type='text'
							no-wheel
							v-model="selectedWalletId"
							:placeholder="$t('editModalHolderEnterIdOrAddress')"
					/>
				</div>

				<div class="row" v-if="!propWalletId && isRemoving">
					<strong class="d-flex mb-05">Select wallet to be removed</strong>
					<div class="d-grid d-grid-4-col is-marginless">
						<b-loading :is-full-page="false" :active.sync="isSpinnerActive" :can-cancel="true"></b-loading>
						<div class="field" v-for="wallet_id in wallet_choices" :key="wallet_id">
							<b-radio :native-value="wallet_id" name="some-radios" type="is-danger" @input="onRadioSelected">
								{{wallet_id}}
							</b-radio>
						</div>
					</div>

				</div>

				<div class="row">
					<b-notification
						:closable="true" 
						:active.sync="isNotificationActive"
						:type="notification_type"
						aria-close-label="Close notification"
						role="alert"
					>
						{{notification_text}}
					</b-notification>
					<div v-if="!propWalletId">
						<div v-if="redirectedWalletId">
							{{isRedirected ? "Redirected to wallet: " : ""}} <wallet-id :id="Number(redirectedWalletId)" newTab/>
						</div>
						<div v-if="wallet_digest">
							Total on wallet: <btc-amount :amount="wallet_digest.total_on_wallet"/>
							Addresses on wallet: {{wallet_digest.addr_count}}
						</div>
					</div>
					<div v-if="rewardAmount>0" class="pt-3">
						<i18n v-if="isRemoving" path="editModalGainIfRemoved" id="potential-gain">
							<template #stake_amount>
								<byte-amount :amount="stakeAmount"/>
							</template>
							<template #gain_amount>
								<byte-amount :amount="rewardAmount"/>
							</template>
							<template #wallet>
								{{selectedWalletId}}
							</template>
							<template #exchange>
								<exchange :id="selectedExchange" noUrl/>
							</template>
						</i18n>
						<i18n v-else path="editModalGainIfAdded" id="potential-gain">
							<template #stake_amount>
								<byte-amount :amount="stakeAmount"/>
							</template>
							<template #gain_amount>
								<byte-amount :amount="rewardAmount"/>
							</template>
							<template #wallet>
								{{selectedWalletId}}
							</template>
							<template #exchange>
								<exchange :id="selectedExchange" noUrl/>
							</template>
						</i18n>
					</div>
					<div v-else-if="isOperationPossible" class="pt-3">
						<i18n v-if="isRemoving" path="editModalRefundIfRemoved" id="potential-gain">
							<template #stake_amount>
								<byte-amount :amount="stakeAmount"/>
							</template>
							<template #gain_amount>
								<byte-amount :amount="rewardAmount"/>
							</template>
							<template #wallet>
								{{selectedWalletId}}
							</template>
							<template #exchange>
								<exchange :id="selectedExchange" noUrl/>
							</template>
						</i18n>
						<i18n v-else path="editModalRefundIfAdded" id="potential-gain">
							<template #stake_amount>
								<byte-amount :amount="stakeAmount"/>
							</template>
							<template #gain_amount>
								<byte-amount :amount="rewardAmount"/>
							</template>
							<template #wallet>
								{{selectedWalletId}}
							</template>
							<template #exchange>
								<exchange :id="selectedExchange" noUrl/>
							</template>
						</i18n>

					</div>

					<div v-else-if="isSpinnerActive" class="container">
						<b-loading label="Spinning" :is-full-page="false" :active.sync="isSpinnerActive"
											 :can-cancel="true"></b-loading>
					</div>

					<div class="row">
						{{$t('editModalProofExplanation')}}
					</div>
					<url-inputs @urls_updated="urls_updated" :isAtLeastOneUrlRequired="true"/>
				</div>

			</div>
			<div class="container" v-if="link" fluid>
				<div class="pt-3">
					{{$t('editModalLinkHeader')}}
				</div>
				<div class="pt-3">
					<wallet-link :link="link" />
				</div>
				<div class="py-3 test">
					{{$t('editModalLinkFooter')}}
				</div>
			</div>
		</section>
		<footer class="modal-card-foot f-end">
			<button class="button is-primary" v-if="link" @click="link=null">Back</button>
			<button class="button" type="button" @click="$parent.close()">Close</button>
			<button class="button is-primary" v-if="!link" :disabled="isOkDisabled" @click="handleOk">Ok</button>
		</footer>
	</div>
</template>

<script>
	const conf = require('../../conf.js')
	import ByteAmount from './ByteAmount.vue'
	import Exchange from './Exchange.vue'
	import UrlInputs from './UrlInputs.vue'
	import validate from 'bitcoin-address-validation'
	import WalletLink from './WalletLink.vue'
	import WalletId from './WalletId.vue'
	import BtcAmount from './BtcAmount.vue'

	export default {
		components: {
			BtcAmount,
			ByteAmount,
			UrlInputs,
			Exchange,
			WalletLink,
			WalletId
		},
		props: {
			propWalletId: {
				type: Number,
				required: false,
				default: null,
			},
			propExchange: {
				type: String,
				required: false,
				default: null,
			},
			isRemoving: {
				type: Boolean,
				required: false,
				default: false,
			},
		},
		data () {
			return {
				notification_text: '',
				notification_type: '',
				selectedWalletId: null,
				redirectedWalletId: null,
				wallet_choices: [],
				selectedExchange: null,
				isSpinnerActive: false,
				isOperationPossible: false,
				isRedirected: false,
				rewardAmount: false,
				wallet_digest: null,
				stakeAmount: conf.challenge_min_stake_gb * conf.gb_to_bytes,
				link: false,
				urls: [],
				bAreUrlsValid: false,
				inputCoolDownTimer: null,
				key: '',
			}
		},
		methods: {
			urls_updated (urls, bAreUrlsValid) {
				this.urls = urls
				this.bAreUrlsValid = bAreUrlsValid
			},
			isWalletId (wallet) {
				return (Number(wallet) && parseInt(wallet))
			},
			onRadioSelected (arg) {
				this.selectedWalletId = arg
				this.check()
			},
			onWalletInputChanged () {
				clearTimeout(this.inputCoolDownTimer)
				if (this.selectedWalletId.length > 0)
					this.inputCoolDownTimer = setTimeout(this.check, 1000)
			},
			check () {
				this.notification_text = null
				this.bestPoolId = false
				this.rewardAmount = 0
				this.isSpinnerActive = true
				this.isOperationPossible = false
				this.bestPoolId = false
				this.isRedirected = false
				this.wallet_digest = null

				this.axios.get('/api/redirection/' + this.selectedWalletId).then((response, error) => {
					this.redirectedWalletId = response.data.redirected_id
					if (!this.redirectedWalletId)
						return this.notification_text = this.$t('editModalWalletNotFound')

					if (this.selectedWalletId != this.redirectedWalletId)
						this.isRedirected = true;

					this.axios.get('/api/wallet/' + this.redirectedWalletId+ '/0').then((response) => {
						if (response.data.isOnOperation && !this.isRemoving) {
							this.notification_text = this.$t('editModalOperationOnGoing',
								{ wallet: this.redirectedWalletId })
							this.notification_type = 'is-danger'
						}

						if (response.data.exchange == this.selectedExchange && !this.isRemoving){
							this.notification_text = this.$t('editModalAlreadyBelongs',
									{ wallet: this.redirectedWalletId, exchange: this.selectedExchange })
							this.notification_type = 'is-danger'
							return
						}
						if (response.data.exchange != this.selectedExchange && this.isRemoving){
							this.notification_text = this.$t('editModalDoesntBelong',
									{ wallet: this.redirectedWalletId, exchange: this.selectedExchange })
							this.notification_type = 'is-danger'
							return
						}
						this.wallet_digest = {
							addr_count: response.data.addr_count,
							total_on_wallet: response.data.total_on_wallets
						}

						if (!this.notification_text) {
							this.getBestPool()
						} else {
							this.isSpinnerActive = false
						}

					})
				}).catch((error) => {
					this.notification_text = this.$t('editModalWalletNotFound')
					this.isSpinnerActive = false
				})
			},
			getBestPool () {
				this.axios.get('/api/pool/' + this.selectedExchange).then((response) => {
					this.isSpinnerActive = true
					if (response.data.pool_id) {
						this.bestPoolId = response.data.pool_id
						this.rewardAmount = response.data.reward_amount
					} else {
						this.notification_text = this.$t('editModalNoRewardAvailable')
						this.notification_type = 'is-warning'
					}
					this.isOperationPossible = true
					this.isSpinnerActive = false
				})
			},
			onExchangeInput(option){

				if (!this.assocExchangesByName[option]){
					this.notification_text = this.$t('editModalExchangeNotReferenced')
					this.notification_type = 'is-danger'
					return
				}
				this.selectedExchange = this.assocExchangesByName[option];
				this.check()
			},
			handleOk (bvModalEvt) {
				bvModalEvt.preventDefault()
				const base64url = require('base64url')
				const data = {
					exchange: this.selectedExchange,
					pool_id: this.bestPoolId,
				}

				if (this.urls[0])
					data.url_1 = this.urls[0]
				if (this.urls[1])
					data.url_2 = this.urls[1]
				if (this.urls[2])
					data.url_3 = this.urls[2]
				if (this.urls[3])
					data.url_4 = this.urls[3]
				if (this.urls[4])
					data.url_5 = this.urls[4]

				if (this.isRemoving)
					data.remove_wallet_id = this.selectedWalletId
				else
					data.add_wallet_id = this.selectedWalletId

				const json_string = JSON.stringify(data)
				const base64data = base64url(json_string)
				this.link = (conf.testnet ? 'byteball-tn' : 'byteball') + ':' + conf.aa_address + '?amount='
					+ this.stakeAmount + '&base64data=' + base64data
			},
		},
		computed: {
			isNotificationActive(){
				return !!this.notification_text
			},
			filteredDataObj () {
				const data = this.assocExchangesByName
				const options = Object.entries(data).map(([key, value]) => ({ key, value }))
				return options.filter((option) => {
					return option.key.toString().toLowerCase().indexOf(this.key.toLowerCase()) >= 0
				})
			},
			getTitle: function () {
				let title = ''
				const exchangeName = this.assocExchangesById[this.selectedExchange] ? this.assocExchangesById[this.selectedExchange].name : ''
				if (this.propExchange) {
					if (this.selectedWalletId && this.selectedExchange) {
						title = this.isRemoving ? this.$t('editModalRemoveXFromX',
							{ exchange: exchangeName}) :
							this.$t('editModalAddXToX', {
								exchange: exchangeName,
								wallet: this.isWalletId(this.redirectedWalletId || this.selectedWalletId) ? this.redirectedWalletId || this.selectedWalletId : '',
							})
					} else if (this.selectedExchange) {
						title = this.isRemoving ? this.$t('editModalRemoveFromX',
							{ exchange: exchangeName }) :
							this.$t('editModalAddToX', { exchange: exchangeName })
					} else if (this.selectedWalletId) {
						title = this.isRemoving ? this.$t('editModalRemoveXFrom', { wallet: this.selectedWalletId }) :
							this.$t('editModalAddXTo',
								{ wallet: this.isWalletId(this.selectedWalletId) ? this.selectedWalletId : '' })
					}
				} else if (this.propWalletId) {
					title = this.$t('editModalAddXToX', {
						exchange: exchangeName,
						wallet: this.isWalletId(this.redirectedWalletId || this.selectedWalletId) ? this.redirectedWalletId || this.selectedWalletId : '',
					})
				}
				return title
			},
			assocExchangesById () {
				return this.$store.state.exchangesById
			},
			assocExchangesByName () {
				return this.$store.state.exchangesByName
			},
			isOkDisabled () {
				return !this.bAreUrlsValid || !this.isOperationPossible
			},
		},
		created() {
				this.selectedExchange = this.propExchange
				this.selectedWalletId = this.propWalletId
				if (!this.selectedWalletId && this.selectedExchange && this.isRemoving) {
					this.axios.get('/api/exchange-wallets/' + this.selectedExchange).then((response) => {
						this.wallet_choices = response.data
					})
				}
				if (this.propWalletId && this.assocExchangesById[this.selectedExchange] && this.assocExchangesById[this.selectedExchange].name)// we have a wallet id as prop and exchange input is valid, let's go to check
					this.check()
		},
		beforeDestroy () {
			clearTimeout(this.inputCoolDownTimer)
		},
	}
</script>

<style lang='scss'>
	.add-wallet .dropdown-content {
		max-height: 100px !important;
	}

	.d-grid {
		.radio {
			margin-left: 0 !important;
		}
	}
</style>
