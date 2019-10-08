<template>
	<b-container fluid>
		<EditWalletModal :prop_exchange="exchange"  :prop_wallet_id="clicked_wallet" remove="1"/>
		<b-row v-if="title">
			<b-col offset-lg="1" lg="10" cols="12" class="py-3">
			<h3 class="text-center">{{title}}</h3>
			</b-col>
		</b-row >
		<b-col offset-lg="1" lg="10" cols="12" class="py-3">
				<b-row v-if="exchangeWallets && !isSpinnerActive">
				 Wallets for this exchange:
					<b-row class="pl-3" align-h="start">
						<div v-for="(wallet,index) in exchangeWallets" v-bind:key="index">
							<b-col >
								<b-link :to="'/explorer/'+wallet">{{wallet}}</b-link>
							<b-button size="sm"  v-on:click="clicked_wallet=wallet" v-b-modal.editWallet>remove wallet</b-button>

							</b-col>

						</div>
					</b-row >
				</b-row>
			<b-row v-if="count_total  && !isSpinnerActive">
			{{count_total}} transaction{{count_total > 1 ? 's' : ''}} found.
			</b-row>
			<b-row v-if="isSpinnerActive">
				<div class="text-center w-100">
					<b-spinner label="Spinning"></b-spinner>
				</div>
			</b-row>
		</b-col>
		<b-row v-if="!isSpinnerActive && transactions">
			<b-col offset-lg="1" lg="10" cols="12" class="py-3 main-col">
				<b-row  class="text-center">
					<div  class="w-100" v-for="(transaction,key,index) in transactions" v-bind:key="key">
					<Transaction :tx_id="key" :transaction="transaction" :no_border="index == (Object.keys(transactions).length-1)" :about_wallet_ids="redirected_ids"/>
				</div>
				</b-row>
			</b-col>

		</b-row>
					<b-row class="text-center" v-if="!isSpinnerActive&&failoverText">
					{{failoverText}}
			</b-row>
	</b-container>
</template>

<script>
import Transaction from './Transaction.vue'
import validate from 'bitcoin-address-validation';
import EditWalletModal from './commons/EditWalletModal.vue';

export default {
	components: {
		Transaction,
		EditWalletModal
	},
	props: ['request_input'],
	data() {
		return {
			transactions: null,
			count_total: null,
			exchangeName: null,
			exchange :null,
			exchangeWallets: null,
			clicked_wallet: null,
			title: null,
			isSpinnerActive: true,
			failoverText: null,
			redirected_ids: []
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
			this.exchangeWallets = null;
			this.exchange = null;
			this.title = null;
			this.failoverText =null;
			this.redirected_ids = [];
			if (Number(this.request_input)) { // it's a wallet id
				this.title = "Transactions for wallet " + this.request_input;
				this.axios.get('/api/wallet/' + this.request_input).then((response) => {
				this.title = "Transactions for wallet " + response.data.redirected_id;

				if (response.data.txs){
					this.transactions = response.data.txs.txs;
					this.count_total = response.data.txs.count_total;
					this.redirected_ids = [response.data.redirected_id];

				} else {
					this.failoverText = "No transaction found for wallet " + this.request_input;
				}
					this.isSpinnerActive = false;
				});
			} else if (isTxId(this.request_input)) { // it's a tx id
				this.title = "Transaction " + this.request_input;
				this.axios.get('/api/txid/' + this.request_input).then((response) => {
					console.log(response.data);
					if (response.data.txs){
						this.transactions = response.data.txs;
						this.count_total = null;
						this.isSpinnerActive = false;
					} else {
						this.failoverText = "Transaction " + this.request_input + " not found.";
					}
				});

			} else if (validate(this.request_input)) { // it's a BTC address
				this.title = "Looking for known wallet for " + this.request_input;
				this.axios.get('/api/address/' + this.request_input).then((response) => {
				this.title = "Transactions for wallet " + response.data.redirected_id;
				if (response.data.txs){
						this.transactions = response.data.txs.txs;
						this.count_total = response.data.txs.count_total;
						this.redirected_ids = [response.data.redirected_id];
				} else {
					this.failoverText = "No wallet known for address " + this.request_input  + ".";
				}
					this.isSpinnerActive = false;
				});

			}  else if (this.request_input) { // should be an exchange
				this.axios.get('/api/exchange/' + this.request_input).then((response) => {
					this.title = "Transactions for exchange " + response.data.name;
					if (response.data.txs){
						this.transactions = response.data.txs.txs;
						this.count_total = response.data.txs.count_total;
						this.exchangeWallets = response.data.wallet_ids;
						this.redirected_ids = response.data.redirected_ids;
						this.exchange = this.request_input;
					} else if (!response.data.wallet_ids.length == 0){
						this.failoverText = "No wallet known for exchange " + response.data.name + ".";
					} else {
						this.failoverText = "No transaction found for exchange " + response.data.name + ".";
					}
					this.exchangeName =  response.data.name;
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
