<template>
	<div class="main">
		<NavBar selected_item='1' />
		<b-container fluid >
			<b-row v-if="!url_input">
				<b-col cols="12" class="py-3">
					<h3 class="text-center">Wallet explorer</h3>
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
							<button type="submit" class="btn btn-primary">Go</button>
						</b-form>
					</div>
				<div v-if="arrExchanges" class="pt-4">
					Or browse by exchange:
					<b-row class="py-4" align-h="start">
						<div v-for="(exchange,index) in arrExchanges" v-bind:key="index">
							<b-col >	<b-link :to="'/explorer/'+exchange.id">{{exchange.name}}</b-link></b-col>
						</div>
					</b-row >
				</div>
				</b-col>
			</b-row>
			<b-row v-else  >
				<Transactions :request_input="url_input" />
			</b-row>
		</b-container>
	</div>
</template>

<script>
import NavBar from './NavBar.vue'
import Transactions from './Transactions.vue'

export default {
	name: 'ExchangesStats',
	props: ['url_input'],
	components: {
		NavBar,
		Transactions
	},
	data() {
		return {
			user_input: "",
			arrExchanges: null
		}
	},
	watch: {
		$route(route) {
			this.getExchanges();
		}
	},
	created(){
		this.getExchanges();
	},
	methods:{ 
		onSubmit(){
			this.$router.push({ name: 'explorerInput', params: { url_input: this.user_input } })
		},
		getExchanges(){
			if (!this.url_input){
					this.axios.get('/api/exchanges').then((response) => {
						console.log(response.data);
						this.arrExchanges = response.data.sort(function(a,b){
							return a.name.toUpperCase() > b.name.toUpperCase();
						});
					});
			}
		}
	}
}
</script>

<style lang='scss'>

</style>
