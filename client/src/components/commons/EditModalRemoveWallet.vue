<template>
	<div class="modal-card add-wallet">
		<header class="modal-card-head">
			<p class="modal-card-title">{{ this.getTitle }}</p>
			<button class="delete" aria-label="close" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="container" v-show="!link">

				<div class="row" v-if="!propWalletId">
					<strong class="d-flex mb-05">{{$t('editModalSelectWalletToBeRemoved')}}</strong>
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
						<div v-if="targetedWalletId">
							 <wallet-id :id="Number(targetedWalletId)" newTab/>
						</div>
						<div v-if="wallet_digest" class="mb-05">
							Total on wallet: <btc-amount :amount="wallet_digest.total_on_wallet"/>
							- Addresses on wallet: {{wallet_digest.addr_count}}
						</div>
					</div>
					<div v-if="rewardAmount>0" class="pt-3">
						<i18n path="editModalGainIfRemoved" id="potential-gain">
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
						<i18n path="editModalRefundIfRemoved" id="potential-gain">
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

				<div class="row" v-if="propWalletId || selectedWalletId">
					<operation-history-collapse :exchange="selectedExchange" :walletId="selectedWalletId" />
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
			<button class="button is-primary" v-if="link" @click="link=null">{{$t('commonButtonBack')}}</button>
			<button class="button" type="button" @click="$parent.close()">{{$t('commonButtonClose')}}</button>
			<button class="button is-primary" v-if="!link" :disabled="isOkDisabled" @click="handleOk">{{$t('commonButtonOk')}}</button>
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
	import BtcAmount from './BtcAmount.vue'
	import OperationHistoryCollapse from './LastOperationHistoryCollapse.vue'
	import editModal from '../../mixins/editModal'
	import WalletId from './WalletId.vue'

	export default {
		mixins:[editModal],
		components: {
			BtcAmount,
			ByteAmount,
			UrlInputs,
			Exchange,
			WalletLink,
			OperationHistoryCollapse,
			WalletId
		},
		props: {

		},
		data () {
			return {
				wallet_choices: [],
				isRemoving: true,
			}
		},
		methods: {
			onRadioSelected (arg) {
				this.selectedWalletId = arg
				this.checkIfOperationIsPossible()
			},

		},
		computed: {
			getTitle: function () {
				let title = ''
				const exchangeName = this.assocExchangesById[this.selectedExchange] ? this.assocExchangesById[this.selectedExchange].name : ''
				const walletId = this.isWalletId(this.selectedWalletId) ? this.selectedWalletId : '' 
				if (this.selectedWalletId && this.selectedExchange) {
					title = this.$t('editModalRemoveXFromX',
						{ exchange: exchangeName,
							wallet: walletId,
						})
				} else if (this.selectedExchange) {
					title = this.$t('editModalRemoveFromX',
						{ exchange: exchangeName })
				} else if (this.selectedWalletId) {
					title = this.$t('editModalRemoveXFrom', { wallet: this.selectedWalletId }) 
				}

				return title
			}
		},
		created() {
				if (!this.selectedWalletId && this.selectedExchange) {
					this.axios.get('/api/exchange-wallets/' + this.selectedExchange).then((response) => {
						this.wallet_choices = response.data
					})
				}
				if (this.propWalletId && this.assocExchangesById[this.selectedExchange] && this.assocExchangesById[this.selectedExchange].name)// we have a wallet id as prop and exchange input is valid, let's go to check
					this.checkIfOperationIsPossible()
		}
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
