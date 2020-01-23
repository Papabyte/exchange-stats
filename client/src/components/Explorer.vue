<template>
	<div class="main">
		<nav-bar />

		<section class="section">
			<div class="container">
				<b-notification v-if="welcomeMessageShow" type="is-info" aria-close-label="Close"
												@close="$store.commit('setWasExplorerWelcomeMessageClosed',true)">
					{{$t('explorerWelcomeMessage')}}
				</b-notification>
			</div>
		</section>

		<section class="section">
			<div class="container" v-if="!url_input">
				<h3 class="title is-3 mb-2">{{$t('explorerTitle')}}</h3>
			</div>

			<div class="container" v-if="!url_input">
				<div class="box">
					<div class="columns">
						<div class="column is-four-fifths">
							<b-autocomplete
									id="input-1"
									v-model="user_input"
									type="text"
									required
									:data="filteredExchangesObj"
									:placeholder="$t('ExplorerUserInputPlaceholder')"
									field="key"
									@select="onSelect">
								<template slot-scope="props">
									<b>{{ props.option.value }}</b>
									<br>
									<small>
										{{ props.option.key }}
									</small>
								</template>
								</b-autocomplete>
						</div>
						<div class="column">
					<b-button
					size="is-medium"
					type="is-info"
				@click="onSubmit"
			>
				<v-icon name='arrow-right' class="custom-icon"/>
			</b-button>
				</div>
			</div>
					<div class="container">
						<h6 class="title is-6 mt-1 mb-2">{{$t('explorerOrBrowseExchanges')}}</h6>
						<span class="exchange-wrapper">
							<div v-for="exchange in assocExchangesHavingWallet" :key="exchange" >
								<exchange 
								v-bind:key="exchange"
								:showIcon="false"
								:id="exchange"/>
								</div>
						</span>
					</div>
				</div>
			</div>

			<div class="container" v-else-if="show_addresses">
				<addresses :request_input="url_input" :page="Number(page)"/>
			</div>
			<div class="container" v-else>
				<transactions :request_input="url_input" :page="Number(page)"/>
			</div>
		</section>
	</div>
</template>

<script>
	import NavBar from './commons/NavBar.vue'
	import Transactions from './ExplorerTransactions.vue'
	import Addresses from './ExplorerAddresses.vue'
	import Exchange from './commons/Exchange.vue'
	import meta from '../mixins/meta'

	const conf = require('../conf.js')
	export default {
		mixins:[meta],
		components: {
			NavBar,
			Transactions,
			Exchange,
			Addresses,
		},
		props: {
			url_input: {
				type: String,
				required: false,
			},
			page: {
				type: Number || String,
				required: false,
				default: 1,
			},
			show_addresses: {
				type: Boolean,
				required: false,
				default: false,
			},
		},
		data () {
			return {
				user_input: '',
			}
		},
		computed: {
			filteredExchangesObj () {
				const data = this.assocExchangesByName
				const options = Object.entries(data).map(([key, value]) => ({ key, value }))
				return options.filter((option) => {
					return option.key.toString().toLowerCase().indexOf(this.user_input.toLowerCase()) >= 0
				})
			},
			assocExchangesByName: function () {
				return this.$store.state.exchangesByName
			},
			assocExchangesHavingWallet () {
				return Object.values(this.$store.state.exchangesById).filter(value => value.has_wallet).map(value=>this.assocExchangesByName[value.name])
			},
			welcomeMessageShow () {
				return !this.$store.state.wasExplorerWelcomeMessageClosed
			},
		},
		watch: {
			$route (route) {
				this.updateMeta()
			},
		},
		created () {
			this.updateMeta()
		},
		methods: {
			onSubmit () {
				this.$router.push({ name: 'explorerInput', params: { url_input: this.user_input } })
			},
			onSelect(option){
				this.$router.push({ name: 'explorerInput', params: { url_input: option.value } })

			},
			updateMeta(){
				this.setTitle(this.$t("explorerPageTitle", {website_name: conf.website_name}))
				this.setMetaDescription(this.$t("explorerMetaDescription"))
				this.setRobotDirective('all')
			}

		},
	}
</script>

<style lang='scss'>
	.section {
		padding: 2rem 1.5rem;
	}

	.exchange-wrapper {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-start;
		margin: -0.75rem;

		& > div {
			margin: 0.75rem;
		}
	}

	.custom-icon {
		height: 50px;
		padding: auto;
	}
</style>
