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
									placeholder="Enter BTC address, transaction id or wallet id."
									@select="onSubmit">
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
							<exchange v-for="key in assocExchangesByName" 
								v-bind:key="key"
								:showIcon="false"
								:id="key"/>
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

	const conf = require('../conf.js')
	export default {
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
			welcomeMessageShow () {
				return !this.$store.state.wasExplorerWelcomeMessageClosed
			},
		},
		watch: {
			$route (route) {
				this.updateTitleAndDescription()
			},
		},
		created () {
			this.updateTitleAndDescription()
		},
		methods: {
			onSubmit () {
				this.$router.push({ name: 'explorerInput', params: { url_input: this.user_input } })
			},
			updateTitleAndDescription(){
				document.title = this.$t('explorerPageTitle', { website_name: conf.website_name })
				document.getElementsByName('description')[0].setAttribute('content', this.$t('explorerMetaDescription'))
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

		& > span {
			margin: 0.75rem;
		}
	}

	.custom-icon {
		height: 50px;
		padding: auto;
	}
</style>
