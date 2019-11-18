<template>
	<div class="main">
		<nav-bar selected_item='0' />

		<section class="section">
			<div class="container">
				<b-notification v-if="welcomeMessageShow" type="is-info" aria-close-label="Close" @close="$store.commit('setWasExplorerWelcomeMessageClosed',true)">
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

					<div class="container">
						<h6 class="title is-6 mb-2">{{$t("explorerOrBrowseExchanges")}}</h6>

						<b-button type="is-light" v-for="(exchange,index) in arrExchanges" v-bind:key="index">
							<exchange :showIcon="false" :id="exchange.id"/>
						</b-button>
					</div>
				</div>
			</div>
			<div class="container" v-else>
				<transactions :request_input="url_input" :page="Number(page)"/>
			</div>
		</section>
	</div>
</template>

<!--<template>-->
<!--	<div class="main">-->
<!--		<nav-bar selected_item='1' />-->
<!--		<b-container fluid >-->
<!--			<b-row v-if="!url_input">-->
<!--				<b-col cols="12" class="py-3">-->
<!--					<h3 class="text-center">{{$t("explorerTitle")}}</h3>-->
<!--				</b-col>-->
<!--			</b-row >-->
<!--			<b-row v-if="!url_input" >-->
<!--				<b-col offset-lg="3" lg="6" cols="12"  class="py-3 main-block">-->
<!--					<div>-->
<!--						<b-form class="form-inline w-100 mt-5" @submit="onSubmit">-->
<!--							<b-form-input responsive-->
<!--							id="input-1"-->
<!--							v-model="user_input"-->
<!--							type="text"-->
<!--							required-->
<!--							placeholder="Enter BTC address, transaction id or wallet id."-->
<!--							class="mx-2 flex-fill"-->
<!--							></b-form-input>-->
<!--							<button type="submit" class="btn btn-primary">{{$t("explorerButtonGo")}}</button>-->
<!--						</b-form>-->
<!--					</div>-->
<!--				<div v-if="arrExchanges" class="pt-4">-->
<!--					{{$t("explorerOrBrowseExchanges")}}-->
<!--					<b-row class="py-4" align-h="start">-->
<!--						<div v-for="(exchange,index) in arrExchanges" v-bind:key="index">-->
<!--							<b-col >	<exchange :showIcon="false" :id="exchange.id"/></b-col>-->
<!--						</div>-->
<!--					</b-row >-->
<!--				</div>-->
<!--				</b-col>-->
<!--			</b-row>-->
<!--			<b-row v-else  >-->
<!--				<transactions :request_input="url_input" :page="Number(page)"/>-->
<!--			</b-row>-->
<!--		</b-container>-->
<!--	</div>-->
<!--</template>-->

<script>
import NavBar from './commons/NavBar.vue'
import Transactions from './ExplorerTransactions.vue'
import Exchange from './commons/Exchange.vue';
const conf = require('../conf.js');
export default {
	components: {
		NavBar,
		Transactions,
		Exchange
	},
	props: {
		url_input: {
			type: String,
			required: false
		},
		page: {
			type: Number,
			required: false,
			default: 1
		}
	},
	data() {
		return {
			user_input: ""
		}
	},
	computed:{
		arrExchanges: function(){
			return this.$store.state.exchanges;
		},
		welcomeMessageShow(){
			return !this.$store.state.wasExplorerWelcomeMessageClosed;
		}
	},
	watch: {
		$route(route) {
		}
	},
	created(){
		document.title = this.$t("explorerPageTitle", {website_name:conf.website_name});
		document.getElementsByName('description')[0].setAttribute('content',this.$t("explorerMetaDescription"));
	},
	methods:{
		onSubmit(){
			this.$router.push({ name: 'explorerInput', params: { url_input: this.user_input } })
		}
	}
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
