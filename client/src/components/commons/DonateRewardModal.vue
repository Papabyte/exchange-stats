<template>
	<div class="modal-card" id="donateReward" @close="link=false">
		<header class="modal-card-head">
			<p class="modal-card-title">Donate a reward</p>
			<button class="delete" aria-label="close" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="container" v-show="!link">
				<div v-if="!propExchange">
					<div class="row">

						<b-field :label="$t('donateModalSelectExchange')">
							<b-autocomplete
									v-model="key"
									@input="onExchangeInput"
									:keep-first="false"
									:open-on-focus="true"
									:data="filteredDataObj"
									:disabled="isForAny || propExchange"
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
					<div class="row">
						<div class="field">
							<b-checkbox
									v-model="isForAny"
									:disabled="propExchange"
									@input="exchange ='';key=''">
								{{$t('donateModalDonateForAny')}}
							</b-checkbox>
						</div>

					</div>
				</div>
				<div class="row">
					<b-field :label="$t('donateModalIndividualRewardAmount')">
						<b-slider type="is-info" v-model="amount" :min="0.01" :max="10" :step="0.01"></b-slider>
						<byte-amount :amount="amount*gb_to_bytes"/>
					</b-field>
				</div>
				<div class="row">

					<b-field :label="$t('donateModalNumberOfRewards')">
						<b-slider type="is-info" v-model="nb_reward" :min="1" :max="10" :step="1"></b-slider>
						{{nb_reward}}
					</b-field>
				</div>
				<div class="row">
					<div v-if="validExchange || isForAny" class="title is-5 donate-to-exchange">
						<i18n v-if="!isForAny" path="donateModalDonateAmountFor" tag="label" id="donate-amount">
							<template #amount>
								<byte-amount :amount="Math.round(nb_reward*amount*gb_to_bytes)"/>
							</template>
							<template #exchange>
								<exchange :id="exchange" newTab/>
							</template>
						</i18n>
						<i18n v-else path="donateModalDonateAmountForAny" tag="label" id="donate-amount">
							<template #amount>
								<byte-amount :amount="Math.round(nb_reward*amount*gb_to_bytes)"/>
							</template>
						</i18n>
					</div>
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
			<button class="button is-primary" v-if="!link" :disabled="!validExchange && !isForAny &&!propExchange" @click="handleOk">Ok</button>
		</footer>
	</div>
</template>

<script>
	import ByteAmount from './ByteAmount.vue'
	import Exchange from './Exchange.vue'
	import WalletLink from './WalletLink.vue'

	const conf = require('../../conf.js')

	export default {
		components: {
			ByteAmount,
			Exchange,
			WalletLink,
		},
		props: {
			propExchange: {
				type: String,
				required: false,
			}
	},
		data () {
			return {
				objExchanges: [],
				isForAny: false,
				amount: this.$store.state.aaParameters.min_reward/conf.gb_to_bytes,
				exchange: '',
				key: '',
				nb_reward: 1,
				link: false,
				gb_to_bytes: conf.gb_to_bytes,
				objOfItems: [],
				id: '',
			}
		},
		created: function(){
			if (this.propExchange){
				this.exchange = this.propExchange;
			}

		},
		computed: {
			validExchange () {
				if (this.isForAny)
					return null
				return !!this.assocExchangesById[this.exchange]
			},
			filteredDataObj () {
				const data = this.assocExchangesByName
				const options = Object.entries(data).map(([key, value]) => ({ key, value }))
				return options.filter((option) => {
					return option.key.toString().toLowerCase().indexOf(this.key.toLowerCase()) >= 0
				})
			},
			assocExchangesByName () {
				return this.$store.state.exchangesByName
			},
			assocExchangesById () {
				return this.$store.state.exchangesById
			}
		},
		methods: {
			onExchangeInput(option){
				console.log(option)
				if (!this.assocExchangesByName[option])
					return
				this.exchange = this.assocExchangesByName[option]
								console.log(this.exchange)

			},
			handleOk (bvModalEvt) {
				bvModalEvt.preventDefault()
				const base64url = require('base64url')
				const data = {
					number_of_rewards: this.nb_reward,
					reward_amount: this.amount * conf.gb_to_bytes,
				}
				if (!this.isForAny)
					data.exchange = this.exchange
				const json_string = JSON.stringify(data)
				const base64data = base64url(json_string)
				this.link = (conf.testnet ? 'byteball-tn' : 'byteball') + ':' + conf.aa_address + '?amount='
					+ (Math.round(this.nb_reward * this.amount * conf.gb_to_bytes)) + '&base64data=' + base64data
			},
		}
	}
</script>

<style lang='scss' scoped>
	.donate-to-exchange {
		& > label {
			line-height: 37px;
		}
	}

	.field {
		&.has-addons {
			display: block;
		}
	}
</style>
