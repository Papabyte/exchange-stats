<template>
	<b-container fluid>
		<b-row v-if="title">
			<b-col offset-lg="1" lg="10" cols="12" class="py-3">
				<h3 class="text-center">{{title}}</h3>
			</b-col>
		</b-row >
		<b-row v-if="exchangeName && !isSpinnerActive">
			<b-col offset-lg="2" lg="8" cols="12" class="py-3">
				Transactions for {{	exchangeName }} exchange. Known wallets:
							<b-row class="py-1" align-h="start">
							<div v-for="(wallet,index) in knownWallets" v-bind:key="index">
								<b-col >	<b-link :to="'/explorer/'+wallet">{{wallet}}</b-link></b-col>
							</div>
							</b-row >	
			</b-col>
		</b-row>
		<b-row v-if="count_total  && !isSpinnerActive">
			<b-col offset-lg="2" lg="8" cols="12" class="py-3">
				{{count_total}} transaction{{count_total > 1 ? 's' : ''}} found.
			</b-col>
		</b-row>
	<b-row v-if="transactions  && !isSpinnerActive">
		<b-col offset-lg="2" lg="8" cols="12" class="py-3">
			<div  v-for="(transaction,key,index) in transactions" v-bind:key="key">
				<Transaction :tx_id="key" :transaction="transaction" :even="index % 2"/>
			</div>
		</b-col>
	</b-row>
		<b-row v-if="isSpinnerActive">
		<b-col offset-lg="2" lg="8" cols="12" class="py-3">
<div class="text-center">
  <b-spinner label="Spinning"></b-spinner>
	</div>
		</b-col>
	</b-row>
		<b-row v-else>
					<b-col offset-lg="2" lg="8" cols="12" class="py-3">

	No transaction found.
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
			transactions: null,
			count_total: null,
			exchangeName: null,
			knownWallets: null,
			title: null,
			isSpinnerActive: true
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
			this.isSpinnerActive = true;
			this.transactions = null;
			this.count_total = null;
			this.exchangeName = null;
			this.knownWallets = null;
			this.title = null;

			if (Number(this.request_input)) { // it's a wallet id
				this.title = "Transactions for wallet " + this.request_input;
				this.axios.get('/wallet/' + this.request_input).then((response) => {
				if (response.data.txs){
					this.transactions = response.data.txs.txs;
					this.count_total = response.data.txs.count_total;
				}
					this.isSpinnerActive = false;
				});
			} else if (isTxId(this.request_input)) { // it's a tx id
				this.title = "Transaction " + this.request_input;
				this.axios.get('/txid/' + this.request_input).then((response) => {
					console.log(response.data);
					this.transactions = response.data.txs;
					this.count_total = null;
					this.isSpinnerActive = false;
				});
			}  else if (this.request_input) { // should be an exchange
				this.axios.get('/exchange/' + this.request_input).then((response) => {
					this.title = "Transactions for exchange " + response.data.name;
					if (response.data.txs){
						this.transactions = response.data.txs.txs;
						this.count_total = response.data.txs.count_total;
					}
					this.exchangeName =  response.data.name;
					this.knownWallets = response.data.wallet_ids;
					this.isSpinnerActive = false;
				});
			}
		}
	}
}

function isTxId(hex){
	return (typeof hex === "string" && hex.length === 64 && hex === (new Buffer(hex, "hex")).toString("hex"));
}

</script>

<style >
</style>
