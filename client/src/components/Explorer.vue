<template>
	<div class="main">
		<nav-bar selected_item='0'/>

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
					<b-field @submit="onSubmit">
						<b-input
								id="input-1"
								v-model="user_input"
								type="text"
								required
								placeholder="Enter BTC address, transaction id or wallet id."></b-input>
					</b-field>

					<div class="container" v-if="arrExchanges">
						<h6 class="title is-6 mb-2">{{$t('explorerOrBrowseExchanges')}}</h6>

						<b-button type="is-light" v-for="(exchange,index) in arrExchanges" v-bind:key="index">
							<exchange :showIcon="false" :id="exchange.id"/>
						</b-button>
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
				type: Number,
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
			arrExchanges: function () {
				return this.$store.state.exchanges
			},
			welcomeMessageShow () {
				return !this.$store.state.wasExplorerWelcomeMessageClosed
			},
		},
		watch: {
			$route (route) {
			},
		},
		created () {
			console.log(this.show_addresses)
			document.title = this.$t('explorerPageTitle', { website_name: conf.website_name })
			document.getElementsByName('description')[0].setAttribute('content', this.$t('explorerMetaDescription'))
		},
		methods: {
			onSubmit () {
				this.$router.push({ name: 'explorerInput', params: { url_input: this.user_input } })
			},
		},
	}
</script>

<style lang='scss'>
	.section {
		padding: 2rem 1.5rem;
	}

	.mb-2 {
		margin-bottom: 2rem;
	}
</style>
