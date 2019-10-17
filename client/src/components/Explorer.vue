<template>
	<div class="main">
		<nav-bar selected_item='1' />
		<b-container fluid >
			<b-row v-if="!url_input">
				<b-col cols="12" class="py-3">
					<h3 class="text-center">{{$t("explorerTitle")}}</h3>
				</b-col>
			</b-row >
			<b-row v-if="!url_input" >
				<b-col offset-lg="3" lg="6" cols="12"  class="py-3 main-col">
					<div>
						<b-form class="form-inline w-100 mt-5" @submit="onSubmit">
							<b-form-input responsive
							id="input-1"
							v-model="user_input"
							type="text"
							required
							placeholder="Enter BTC address, transaction id or wallet id."
							class="mx-2 flex-fill"
							></b-form-input>
							<button type="submit" class="btn btn-primary">{{$t("explorerButtonGo")}}</button>
						</b-form>
					</div>
				<div v-if="arrExchanges" class="pt-4">
					{{$t("explorerOrBrowseExchanges")}}
					<b-row class="py-4" align-h="start">
						<div v-for="(exchange,index) in arrExchanges" v-bind:key="index">
							<b-col >	<b-link :to="'/explorer/'+exchange.id">{{exchange.name}}</b-link></b-col>
						</div>
					</b-row >
				</div>
				</b-col>
			</b-row>
			<b-row v-else  >
				<transactions :request_input="url_input" :page="Number(page)"/>
			</b-row>
		</b-container>
	</div>
</template>

<script>
import NavBar from './commons/NavBar.vue'
import Transactions from './ExplorerTransactions.vue'

export default {
	components: {
		NavBar,
		Transactions
	},
	props: {
		url_input: {
			type: String,
			required: false
		},
		page: {
			type: String,
			required: false,
			default: "0"
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
		}
	},
	watch: {
		$route(route) {
		}
	},
	created(){
		document.title = this.$t("explorerPageTitle");
				document
			.getElementsByTagName('meta')
			.namedItem('description')
			.setAttribute('content', this.$("explorerMetaDescription"));
	},
	methods:{ 
		onSubmit(){
			this.$router.push({ name: 'explorerInput', params: { url_input: this.user_input } })
		}
	}
}
</script>

<style lang='scss'>

</style>
