<template>
	<div class="modal-card add-wallet">
		<header class="modal-card-head">
			<p class="modal-card-title">{{ this.getTitle }}</p>
			<button class="delete" aria-label="close" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="container" v-show="!link">
				<b-loading 
					label="Spinning" 
					:is-full-page="false" 
					:active.sync="isSpinnerActive"
					:can-cancel="false" >
				</b-loading>

				<div class="row py-1">
					The simplest way to find a wallet used by an exchange is to look for your own deposit address.
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
							{{isRedirected ? "Redirected to wallet: " : ""}} <wallet-id :id="Number(targetedWalletId)" newTab/>
						</div>
						<div v-if="wallet_digest" class="mb-05">
							Total on wallet: <btc-amount :amount="wallet_digest.total_on_wallet"/>
							- Addresses on wallet: {{wallet_digest.addr_count}}
						</div>
					</div>
					<div v-if="rewardAmount>0" class="pt-3">
						<i18n  path="editModalGainIfAdded" class="mb-05" id="potential-gain">
							<template #stake_amount>
								<byte-amount :amount="stakeAmount"/>
							</template>
							<template #gain_amount>
								<byte-amount :amount="rewardAmount"/>
							</template>
							<template #wallet>
								{{targetedWalletId}}
							</template>
							<template #exchange>
								<exchange :id="selectedExchange" noUrl/>
							</template>
						</i18n>
					</div>
					<div v-else-if="isOperationPossible" class="pt-3">
						<i18n path="editModalRefundIfAdded" id="potential-gain">
							<template #stake_amount>
								<byte-amount :amount="stakeAmount"/>
							</template>
							<template #gain_amount>
								<byte-amount :amount="rewardAmount"/>
							</template>
							<template #wallet>
								{{targetedWalletId}}
							</template>
							<template #exchange>
								<exchange :id="selectedExchange" noUrl/>
							</template>
						</i18n>
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
	import WalletId from './WalletId.vue'
	import BtcAmount from './BtcAmount.vue'
	import editModal from '../../mixins/editModal'

	export default {
		mixins:[editModal],
		components: {
			BtcAmount,
			ByteAmount,
			UrlInputs,
			Exchange,
			WalletLink,
			WalletId,
		},
		props: {

		},
		data () {
			return {
				inputCoolDownTimer: null,
				isRemoving: false,
			}
		},
		methods: {
			onWalletInputChanged () {
				this.isSpinnerActive = true
				clearTimeout(this.inputCoolDownTimer)
				if (this.selectedWalletId.length > 0)
					this.inputCoolDownTimer = setTimeout(this.checkIfOperationIsPossible, 1000)
			},
		},
		computed: {
			getTitle: function () {
				let title = ''
				const exchangeName = this.assocExchangesById[this.selectedExchange] ? this.assocExchangesById[this.selectedExchange].name : ''
				const walletId = this.targetedWalletId || (this.isWalletId(this.selectedWalletId) ? this.selectedWalletId : '')
					if (this.selectedWalletId && this.selectedExchange) {
						title = this.$t('editModalAddXToX', {
								exchange: exchangeName,
								wallet: walletId,
							})
					} else if (this.selectedExchange) {
						title = this.$t('editModalAddToX', { exchange: exchangeName })
					} else if (this.selectedWalletId) {
						title = this.$t('editModalAddXTo',
								{ wallet: walletId})
					}
				return title
			}
		},
		created() {
				if (this.propWalletId && this.assocExchangesById[this.selectedExchange] && this.assocExchangesById[this.selectedExchange].name)// we have a wallet id as prop and exchange input is valid, let's go to check
					this.checkIfOperationIsPossible()
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
</style>
