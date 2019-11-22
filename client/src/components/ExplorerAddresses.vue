<template>
	<b-container fluid>
		<b-row>
			<b-col offset-lg="1" lg="10" cols="12" class="py-3">
				<h3 class="text-center">{{$t('explorerAddressesAddressesInWallet',{wallet: request_input})}}</h3>
			</b-col>
		</b-row >
		<b-row v-if="count_total">
			<b-col offset-lg="1" lg="10" cols="12" class="py-3">
				{{$t("explorerAddressesCountInWallet",{count:count_total})}} <wallet-id :id="Number(request_input)"/>
			</b-col>
		</b-row>
		<b-row v-if="!isSpinnerActive">
			<b-col offset-lg="1" lg="10" cols="12" class="py-3 main-block">
				<b-row  class="text-center mb-5">
					<b-pagination
						v-model="currentPage"
						:total-rows="count_total"
						per-page="100"
						@change="onPageChanged"
						size="l"
						class="pl-4 pt-2 my-0"
						></b-pagination> 
				</b-row>
				<b-row  class="text-center mb-3">
					<b-col cols="6">Address</b-col>
					<b-col cols="6">View on</b-col>
				</b-row>
				<b-row  class="text-left" v-for="(address,index) in addresses" v-bind:key="index">
					<b-col cols="6">{{address}}</b-col>
					<b-col cols="2 text-break"><a :href="'https://blockstream.info/address/' + address">blockstream.info</a></b-col>
					<b-col cols="2 text-break"><a :href="'https://www.blockchain.com/btc/address/' + address">blockchain.com</a></b-col>
					<b-col cols="2 text-break"><a :href="'https://www.walletexplorer.com/?q=' + address">walletexplorer.com</a></b-col>
				</b-row>
			</b-col>
		</b-row>
	</b-container>
</template>

<script>

const conf = require("../conf.js");
import WalletId from './commons/WalletId.vue';

export default {
	components: {
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
			addresses: [],
			isSpinnerActive: true
		}
	},
	watch: {
		$route(route) {
			this.currentPage = this.page || 1;
			this.getAddresses();
		}
	},
	created() {
		this.currentPage = this.page || 1;
		this.getAddresses();
	},
	beforeDestroy(){
		clearInterval(this.timerId);
	},
	methods: {
		updateTitleAndDescription(){
			document.title =  this.$t("explorerTransactionsPageExchange", {exchange: this.exchangeName, website_name: conf.website_name});
			var description = this.$t("explorerTransactionsMetaDescriptionExchange", {exchange: this.exchangeName});
			document.getElementsByName('description')[0].setAttribute('content', description);
		},
		onPageChanged(value){
			this.$router.push({ name: 'explorerAddressesPaged', params: { url_input: this.request_input, page: value } })
		},
		getAddresses() {
			this.isSpinnerActive = true;
			this.count_total = null;
			this.axios.get('/api/wallet-addresses/' + this.request_input+'/' + (this.currentPage-1)).then((response) => {
				this.progressive_display_level = 1;
				this.addresses = response.data.addresses;
				this.count_total = Number(response.data.addr_count);
				this.isSpinnerActive = false;
			})
		}
	}
}


</script>

<style>

</style>
