<template>
	<div>
		<NavBar selected_item='1' />
		<b-container fluid>
			<b-row >
				<b-col offset-lg="1" lg="10" cols="12" class="py-3">
					<h3 class="text-center">Wallet explorer</h3>
				</b-col>
			</b-row >
			<b-row v-if="!url_input" >
				<b-col offset-lg="3" lg="6" cols="12">
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
					<div v-if="arrExchanges">
						Or browse by exchange:
						<div v-for="(exchange,index) in arrExchanges" v-bind:key="index">
								<b-link :to="'/explorer/'+exchange.id">exchange.name</b-link>
						</div>
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
	created(){
				this.axios.get('/list-exchanges').then((response) => {
					console.log(response.data);
					this.arrExchanges = response.data;
				});

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
