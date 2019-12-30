<template>
	<div class="modal-card add-wallet">
		<header class="modal-card-head">
			<p class="modal-card-title">{{ this.getTitle }}</p>
			<button class="delete" aria-label="close" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="container" v-if="!link">

				<div class="row" v-if="!propExchange && !isRemoving">
					<b-field :label="$t('editModalSelectExchange')">
						<b-autocomplete
								v-model="key"
								@input="option => {selectedExchange = option; check()}"
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
					<b-notification v-if="text_error" :closable="false" :auto-close="true"
													type="is-danger"
													aria-close-label="Close notification"
													role="alert"
					>
						{{text_error}}
					</b-notification>
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
			<div class="container" v-else fluid>
				<div class="pt-3">
					{{$t('editModalLinkHeader')}}
				</div>
				<div class="pt-3">
				<span class="text-break">
					<a :href="link">{{link}}</a>
				</span>
				</div>
				<div class="py-3 test">
					{{$t('editModalLinkFooter')}}
				</div>
			</div>
		</section>
		<footer class="modal-card-foot f-end">
			<button class="button" type="button" @click="$parent.close()">Close</button>
			<button class="button is-primary" :disabled="isOkDisabled" @click="handleOk">Ok</button>
		</footer>
	</div>
</template>

<script>
	const conf = require('../../conf.js')
	import ByteAmount from './ByteAmount.vue'
	import Exchange from './Exchange.vue'
	import UrlInputs from './UrlInputs.vue'
	import validate from 'bitcoin-address-validation'

	export default {
		components: {
			ByteAmount,
			UrlInputs,
			Exchange,
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
				text_error: null,
				selectedWalletId: null,
				wallet_choices: [],
				selectedExchange: null,
				isOperationAllowed: false,
				isSpinnerActive: false,
				isPoolAvailable: false,
				rewardAmount: false,
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
			reset () {
				this.isSpinnerActive = false
				this.text_error = null
				this.isPoolAvailable = false
				this.bestPoolId = false
				this.rewardAmount = 0
				if (!this.selectedWalletId && this.selectedExchange && this.isRemoving) {
					this.axios.get('/api/exchange-wallets/' + this.selectedExchange).then((response) => {
						this.wallet_choices = response.data
					})
				}
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
				this.text_error = null
				this.bestPoolId = false
				this.rewardAmount = 0
				this.isSpinnerActive = true
				this.isPoolAvailable = false
				this.bestPoolId = false

				this.axios.get('/api/redirection/' + this.selectedWalletId).then((response, error) => {
					this.selectedWalletId = response.data.redirected_id
					if (!this.selectedWalletId)
						this.text_error = this.$t('editModalWalletNotFound')

					this.axios.get('/api/operations/' + this.selectedExchange).then((response) => {
						const operations = response.data
						var bFound = false
						for (var i = 0; i < operations.length; i++) {
							if (operations[i].wallet_id != this.selectedWalletId || operations[i].exchange != this.selectedExchange)
								continue
							bFound = true
							if (operations[i].committed_outcome == 'in' && !this.isRemoving) {
								this.text_error = this.$t('editModalAlreadyBelongs',
									{ wallet: this.selectedWalletId, exchange: this.selectedExchange })
								break
							}
							if ((!operations[i].committed_outcome || operations[i].committed_outcome == 'out') && this.isRemoving) {
								this.text_error = this.$t('editModalDoesntBelong',
									{ wallet: this.selectedWalletId, exchange: this.selectedExchange })
								break
							}
							if (operations[i].status == 'onreview')
								this.text_error = this.$t('editModalOperationOnGoing',
									{ wallet: this.selectedWalletId, exchange: this.selectedExchange })
						}

						if (!bFound && this.isRemoving)
							this.text_error = this.$t('editModalDoesntBelong',
								{ wallet: this.selectedWalletId, exchange: this.selectedExchange })

						if (!this.text_error) {
							this.getBestPool()
						} else {
							this.isSpinnerActive = false
						}

					})
				}).catch((error) => {
					this.text_error = this.$t('editModalWalletNotFound')
					this.isSpinnerActive = false
				})
			},
			getBestPool () {
				this.axios.get('/api/pool/' + this.selectedExchange).then((response) => {
					this.isSpinnerActive = true
					if (response.data.pool_id) {
						this.bestPoolId = response.data.pool_id
						this.rewardAmount = response.data.reward_amount
						this.isPoolAvailable = true
					} else {
						this.text_error = this.$t('editModalNoRewardAvailable')
					}
					this.isSpinnerActive = false
				})
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
			filteredDataObj () {
				const data = this.assocExchanges
				const options = Object.entries(data).map(([key, value]) => ({ key, value }))
				return options.filter((option) => {
					return option.key.toString().toLowerCase().indexOf(this.key.toLowerCase()) >= 0
				})
			},
			getTitle: function () {
				let title = ''
				if (this.propExchange) {
					if (this.selectedWalletId && this.selectedExchange) {
						title = this.isRemoving ? this.$t('editModalRemoveXFromX',
							{ exchange: this.assocExchanges[this.selectedExchange], wallet: this.selectedWalletId }) :
							this.$t('editModalAddXToX', {
								exchange: this.assocExchanges[this.selectedExchange],
								wallet: this.isWalletId(this.selectedWalletId) ? this.selectedWalletId : '',
							})
					} else if (this.selectedExchange) {
						title = this.isRemoving ? this.$t('editModalRemoveFromX',
							{ exchange: this.assocExchanges[this.selectedExchange] }) :
							this.$t('editModalAddToX', { exchange: this.assocExchanges[this.selectedExchange] })
					} else if (this.selectedWalletId) {
						title = this.isRemoving ? this.$t('editModalRemoveXFrom', { wallet: this.selectedWalletId }) :
							this.$t('editModalAddXTo',
								{ wallet: this.isWalletId(this.selectedWalletId) ? this.selectedWalletId : '' })
					}
				} else if (this.propWalletId) {
					title = this.$t('editModalAddXToX', {
						exchange: this.assocExchanges[this.selectedExchange],
						wallet: this.isWalletId(this.selectedWalletId) ? this.selectedWalletId : '',
					})
				}
				return title
			},
			validExchange () {
				return !!this.assocExchanges[this.selectedExchange]
			},
			assocExchanges () {
				return this.$store.state.exchangesById
			},
			isOkDisabled () {
				return !this.bAreUrlsValid || !this.isPoolAvailable
			},
		},
		created() {
				this.selectedExchange = this.propExchange
				this.selectedWalletId = this.propWalletId
				this.reset()
				if (this.propWalletId && this.assocExchanges[this.selectedExchange])// we have a wallet id as prop and exchange input is valid, let's go to check
					this.check()
		},
		watch: {
		
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
