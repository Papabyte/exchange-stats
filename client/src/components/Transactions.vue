<template>
	<b-container fluid>
	<b-row >
		<b-col offset-lg="2" lg="8" cols="12" class="py-3">
			<div  v-for="(transaction,key,index) in transactions" v-bind:key="key">
				<Transaction :tx_id="key" :transaction="transaction" :even="index % 2"/>
			</div>
		</b-col>
	</b-row>
	</b-container>
</template>

<script>
import Transaction from './Transaction.vue'

export default {
	components: {
		Transaction
	},
	props: ['request_input'],
	data() {
		return {
			transactions: []
		}
	},
	created() {
		this.getTransactions();
	},
	watch: {
		$route(route) {
			this.getTransactions();
		}
	},
	methods: {
		getTransactions() {
			if (Number(this.request_input)) {
				this.axios.get('/wallet/' + this.request_input).then((response) => {
					console.log(response.data);
					this.transactions = response.data.txs.txs;
				});
			}
		}
	}
}
</script>

<style >
</style>
