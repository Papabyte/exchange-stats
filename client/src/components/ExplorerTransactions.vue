<template>
	<b-container fluid>
		<edit-wallet-modal :propExchange="exchange || walletOwner" :propWalletId="walletIdToEdit" :isRemoving="isRemoving"/>

		<b-row v-if="blockTitle">
			<b-col offset-lg="1" lg="10" cols="12" class="py-3">
			<h3 class="text-center">{{blockTitle}}</h3>
			</b-col>
		</b-row >

		<b-col offset-lg="1" lg="10" cols="12" class="py-3">
			<div v-if="!isSpinnerActive">
				<b-row>
					<b-col cols="10">
						<b-row class="text-center" v-if="failoverText">
							{{failoverText}}
						</b-row>

						<b-row class="text-center" v-if="walletOwner">
							<span class="pr-2">{{$t("explorerTransactionsBelongsTo")}}</span> <Exchange :id="walletOwner"/>
							<b-button 
							v-if="wallet_id" 
							variant="primary"  
							@click="isRemoving=true;walletIdToEdit=wallet_id;$bvModal.show('editWallet');" 
							class="ml-2 button-xs" 
							v-b-tooltip.hover 
							:title="$t('explorerTransactionsButtonRemoveFromExchangeTip')"
							>
							<v-icon name='x' class="x-icon"/></b-button>
						</b-row>

						<b-row v-if="wallet_id&&!walletOwner">
							<b-button variant="primary" size="sm" @click="isRemoving=false;$bvModal.show('editWallet');">{{$t("explorerTransactionsButtonAddToExchange")}}</b-button>
						</b-row>

						<b-row v-if="exchangeWallets">
							{{$t("explorerTransactionsWalletsForExchange")}}
							<b-row class="pl-3" align-h="start">
								<div v-for="(wallet,index) in exchangeWallets" v-bind:key="index">
									<b-col >
										<wallet-id :id="Number(wallet)"/>
										<b-button 
										variant="primary" 
										@click="isRemoving=true;walletIdToEdit=Number(wallet);$bvModal.show('editWallet');" 
										v-b-tooltip.hover 
										:title="$t('explorerTransactionsButtonRemoveFromExchangeTip')"
										class="ml-2 button-xs" >
										<v-icon name='x' class="x-icon"/></b-button>
									</b-col>
								</div>
							</b-row >
						</b-row>

						<b-row class="text-center" v-if="total_on_wallets">
							<span class="pr-1">{{$t("explorerTransactionsTotalOnWallet")}}</span> <btc-amount :amount="total_on_wallets"/>
						</b-row>

						<b-row v-if="count_total">
							{{$t("explorerTransactionsTotalTransactions")}}{{count_total}}
						</b-row>
					</b-col>
					<b-col cols="2" v-if="exchange" class="float-right">
						<b-button 
						variant="primary"
						@click="isRemoving=false;$bvModal.show('editWallet');">
						{{$t('explorerTransactionsButtonAddWallet')}}
						</b-button>
					</b-col>
				</b-row>
			</div>
			<b-row v-else>
				<div class="text-center w-100">
					<b-spinner label="Spinning"></b-spinner>
				</div>
			</b-row>
		</b-col>

		<b-row v-if="!isSpinnerActive && transactions">
			<b-col offset-lg="1" lg="10" cols="12" class="py-3 main-col">
				<b-row  class="text-center">
		<b-pagination
			v-model="currentPage"
			:total-rows="count_total"
			per-page="20"
			@change="onPageChanged"
			size="l"
			class="pl-4 pt-2 my-0"
			></b-pagination> 
					<div  class="w-100" v-for="(transaction,key,index) in transactions" v-bind:key="key">
					<transaction v-if="progressive_display_level>index" :tx_id="key" :transaction="transaction" :no_border="index == (Object.keys(transactions).length-1)" :about_wallet_ids="redirected_ids"/>
				</div>
				</b-row>
			</b-col>
		</b-row>

	</b-container>
</template>

<script>
import Transaction from './ExplorerTransaction.vue'
import validate from 'bitcoin-address-validation';
import EditWalletModal from './commons/EditWalletModal.vue';
import Exchange from './commons/Exchange.vue';
import BtcAmount from './commons/BtcAmount.vue';
import WalletId from './commons/WalletId.vue';
const conf = require("../conf.js");

export default {
		components: {
			Transaction,
			EditWalletModal,
			Exchange,
			BtcAmount,
			WalletId
		},
		props: {
		request_input: {
			type: String,
			required: true
		},
		page: {
			type: Number || String,
			required: false,
			default: 1
		}
	},
	data() {
		return {
			transactions: null,
			count_total: null,
			exchangeName: null,
			exchange :null,
			wallet_id: null,
			exchangeWallets: null,
			title: null,
			isSpinnerActive: true,
			failoverText: null,
			redirected_ids: [],
			isRemoving: null,
			walletOwner: null,
			walletIdToEdit: null,
			tx_id: null,
			total_on_wallets: null,
			progressive_display_level: 1,
			timerId: null
		}
	},
	watch: {
		$route(route) {
			this.currentPage = this.page || 1;
			this.getTransactions();
		}
	},
	created() {
		this.currentPage = this.page || 1;
		this.getTransactions();
		this.timerId = setInterval(() => {
			this.progressive_display_level++;
		}, 200);
	},
	beforeDestroy(){
		clearInterval(this.timerId);
	},
	methods: {
		updateTitleAndDescription(){
			if (this.wallet_id){
				document.title =  this.$t("explorerTransactionsPageTitleWalletId", {wallet_id: this.wallet_id, website_name: conf.website_name});;
				if (this.walletOwner)
					var description = this.$t("explorerTransactionsMetaDescriptionWalletIdWithOwner", {wallet_id: this.wallet_id, exchange: this.walletOwner});
				else
					var description = this.$t("explorerTransactionsMetaDescriptionWalletId", {wallet_id: this.wallet_id});
			} else if (this.tx_id){
				document.title =  this.$t("explorerTransactionsPageTitleTxId", {tx_id: this.tx_id, website_name: conf.website_name});
				var description = this.$t("explorerTransactionsMetaDescriptionTxId", {tx_id: this.tx_id});
			} else if (this.exchangeName){
				document.title =  this.$t("explorerTransactionsPageExchange", {exchange: this.exchangeName, website_name: conf.website_name});
				var description = this.$t("explorerTransactionsMetaDescriptionExchange", {exchange: this.exchangeName});
			}
			document.getElementsByName('description')[0].setAttribute('content', description);
		},
		onPageChanged(value){
			this.$router.push({ name: 'explorerInputPaged', params: { url_input: this.request_input, page: value } })
		},
		getTransactions() {
			this.isSpinnerActive = true;
			this.transactions = null;
			this.count_total = null;
			this.exchangeName = null;
			this.exchangeWallets = null;
			this.exchange = null;
			this.blockTitle = null;
			this.failoverText =null;
			this.redirected_ids = [];
			this.wallet_id = null;
			this.walletOwner = null;
			this.walletIdToEdit = null;
			this.total_on_wallets = null;
			this.tx_id = null;

			if (Number(this.request_input)) { // it's a wallet id
				this.blockTitle = this.$t("explorerTransactionsTransactionsForWallet") + this.request_input;
				this.axios.get('/api/wallet/' + this.request_input+'/' + (this.currentPage-1)).then((response) => {
					this.progressive_display_level = 1;
					this.blockTitle = this.$t("explorerTransactionsTransactionsForWallet") + response.data.redirected_id;
					if (response.data.txs){
						this.transactions = response.data.txs.txs;
						this.count_total = response.data.txs.count_total;
						this.redirected_ids = [response.data.redirected_id];
						this.total_on_wallets = response.data.txs.total_on_wallets;
					} else {
						this.failoverText = this.$t("explorerTransactionsNoTransactionsFound") + this.request_input;
					}
						this.wallet_id = Number(response.data.redirected_id);
						this.walletIdToEdit = this.wallet_id;
						this.walletOwner = response.data.exchange;
						this.isSpinnerActive = false;
						this.updateTitleAndDescription();
					});
			} else if (isTxId(this.request_input)) { // it's a tx id
				this.blockTitle = "Transaction " + this.request_input;
				this.tx_id = this.request_input;
				this.axios.get('/api/txid/' + this.request_input).then((response) => {
					if (response.data.txs){
						this.transactions = response.data.txs;
						this.count_total = null;
						this.isSpinnerActive = false;
					} else {
						this.failoverText = this.$t("explorerTransactionsTransactionsNotFound", {transaction:  this.request_input});
					}
					this.updateTitleAndDescription();
				});

			} else if (validate(this.request_input)) { // it's a BTC address
				this.blockTitle = this.$t("explorerTransactionsLookingForWallet", {address: this.request_input});
				this.axios.get('/api/address/' + this.request_input).then((response) => {
					this.$router.push({ name: 'explorerInputPaged', params: { url_input: response.data.redirected_id}})
				});

			} else if (this.request_input) { // should be an exchange
				this.axios.get('/api/exchange/' + this.request_input+'/' + (this.currentPage-1)).then((response) => {
					this.progressive_display_level = 1;
					this.blockTitle = this.$t("explorerTransactionsTransactionsForExchange", {exchange:  response.data.name});
					if (response.data.txs){
						this.transactions = response.data.txs.txs;
						this.count_total = response.data.txs.count_total;
						this.exchangeWallets = response.data.wallet_ids;
						this.redirected_ids = response.data.redirected_ids;
						this.total_on_wallets = response.data.txs.total_on_wallets;
					} else if (response.data.wallet_ids.length == 0){
						this.failoverText = this.$t("explorerTransactionsNoWalletKnown", {exchange:  response.data.name});
					} else {
						this.failoverText = this.$t("explorerTransactionsNoTransactionFound", {exchange:  response.data.name});
					}
					this.exchange = this.request_input;
					this.exchangeName =  response.data.name;
					this.isSpinnerActive = false;
					this.updateTitleAndDescription();
				});
			}
		}
	}
}

function isTxId(hex){
	return (typeof hex === "string" && hex.length === 64 && hex === (new Buffer(hex, "hex")).toString("hex"));
}

</script>

<style>
.x-icon{
	height: 20px;
	width: 20px;
	margin-left: -8px;
		margin-top: -10px;

}

.button-xs{
	height: 30px;
	width: 30px;
}
</style>
