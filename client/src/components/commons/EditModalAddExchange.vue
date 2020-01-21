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
								v-model="exchange_form_input"
								@input="onExchangeInput"
								:keep-first="false"
								:open-on-focus="true"
								:data="filteredDataObj"
								field="exchange_form_input">
							<template slot-scope="props">
								<b>{{ props.option.value }}</b>
								<br>
								<small>
									{{ props.option.exchange_form_input }}
								</small>
							</template>
						</b-autocomplete>
					</b-field>
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

					<div v-if="rewardAmount>0" class="pt-3">
						<i18n path="editModalGainIfAdded" class="mb-05" id="potential-gain">
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
						<i18n path="editModalRefundIfAdded" id="potential-gain">
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
	import WalletLink from './WalletLink.vue'
	import editModal from '../../mixins/editModal'

	export default {
		mixins:[editModal],
		components: {
			ByteAmount,
			UrlInputs,
			Exchange,
			WalletLink
			
		},
		props: {

		},
		data () {
			return {
				exchange_form_input: '',
				isRemoving: false,
			}
		},
		methods: {
			onExchangeInput(option){

				if (!this.assocExchangesByName[option]){
					this.notification_text = this.$t('editModalExchangeNotReferenced')
					this.notification_type = 'is-danger'
					return
				}
				this.selectedExchange = this.assocExchangesByName[option];
				this.checkIfOperationIsPossible()
			}
		},
		computed: {

			filteredDataObj () {
				const data = this.assocExchangesByName
				const options = Object.entries(data).map(([exchange_form_input, value]) => ({ exchange_form_input, value }))
				return options.filter((option) => {
					return option.exchange_form_input.toString().toLowerCase().indexOf(this.exchange_form_input.toLowerCase()) >= 0
				})
			},
			getTitle: function () {
				let title = ''
				const exchangeName = this.assocExchangesById[this.selectedExchange] ? this.assocExchangesById[this.selectedExchange].name : ''
				const walletId = this.isWalletId(this.selectedWalletId) ? this.selectedWalletId : '' 
					title = this.$t('editModalAddXToX', {
						exchange: exchangeName,
						wallet: walletId,
					})
				return title
			},
		},
		created() {

		},
		beforeDestroy () {
		},
	}
</script>

<style lang='scss'>
	.add-wallet .dropdown-content {
		max-height: 100px !important;
	}

</style>
