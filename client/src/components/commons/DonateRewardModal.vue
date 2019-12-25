<template>
	<div class="modal-card" id="donateReward" @close="link=false">
		<header class="modal-card-head">
			<p class="modal-card-title">Donate a reward</p>
			<button class="delete" aria-label="close" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="container" v-if="!link">
				<div class="row">

					<b-field :label="$t('donateModalSelectExchange')">
						<b-autocomplete
								v-model="exchange"
								@input="option => exchanges = option"
								:keep-first="false"
								:open-on-focus="true"
								:data="objOfItems"
								:disabled="isForAny"
								field="id">
							<template slot-scope="props">
								<b>{{ props.option.name }}</b>
								<br>
								<small>
									{{ props.option.id }}
								</small>
							</template>
						</b-autocomplete>
					</b-field>

					<!--					<label for="input-with-list">{{$t("donateModalSelectExchange")}}</label>-->
					<!--					<b-form-input id="input-with-list" list="input-list"  :state="validExchange" :disabled="isForAny" v-model="exchange"></b-form-input>-->
					<!--					<b-form-datalist id="input-list" :options="objExchanges"  ></b-form-datalist>-->
				</div>
				<div class="row">
					<div class="field">
						<b-checkbox
								v-model="isForAny"
								@input="exchange =''">
							{{$t('donateModalDonateForAny')}}
						</b-checkbox>
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
								<exchange :id="exchange"/>
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
			<div class="container" v-else fluid>
				<b-row class="pt-3">
					{{$t('donateModalLinkHeader')}}
				</b-row>
				<b-row class="pt-3">
			<span class="text-break">
				<a :href="link">{{link}}</a>
			</span>
				</b-row>
				<b-row class="py-3">
					{{$t('donateModalLinkFooter')}}
				</b-row>
			</div>
		</section>
		<footer class="modal-card-foot f-end" v-show="!link">
			<button class="button" type="button" @click="$parent.close()">Close</button>
			<button class="button is-primary" :disabled="!validExchange && !isForAny" @click="handleOk">Ok</button>
		</footer>
	</div>
</template>

<script>
	import ByteAmount from './ByteAmount.vue'
	import Exchange from './Exchange.vue'

	const conf = require('../../conf.js')

	export default {
		components: {
			ByteAmount,
			Exchange,
		},
		data () {
			return {
				objExchanges: [],
				selectedExchange: null,
				isForAny: false,
				amount: conf.min_reward_gb,
				exchange: '',
				nb_reward: 1,
				link: false,
				gb_to_bytes: conf.gb_to_bytes,
				objOfItems: [],
				id: ''
			}
		},
		computed: {
			validExchange () {
				if (this.isForAny)
					return null
				return !!this.objExchanges[this.exchange]
			}
		},
		mounted () {
			this.axios.get('/api/exchanges').then((response) => {
				response.data.forEach((row)=>{
					this.objExchanges[row.id] = row.name;
				});
				this.objOfItems = Object.entries(this.objExchanges).map(([id, name]) => ({id, name}))
				return this.objOfItems.filter((option) => {
					return option.id.toString().toLowerCase().indexOf(this.exchange.toLowerCase()) >= 0
				})
			}).catch(function (error) {
				console.log(error);
			});
		},
		methods: {
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
		},
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
