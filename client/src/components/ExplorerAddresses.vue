<template>
	<div>
		<h3 class="title is-3 mb-2">{{$t('explorerAddressesAddressesInWallet',{wallet: request_input})}}</h3>
		<div class="box">
			<div v-if="count_total" class="d-flex ai-center">
				<h5 class="title is-5 d-inline-block is-marginless mr-05">{{$t("explorerAddressesCountInWallet",{count:count_total})}}</h5> <wallet-id :id="Number(request_input)"/>
			</div>
		</div>

		<div class="box" v-if="!isSpinnerActive">
			<b-pagination
					v-model="currentPage"
					:total-rows="count_total"
					per-page="100"
					@change="onPageChanged"
			></b-pagination>

			<div class="notification columns transaction-headers is-paddingless is-marginless">
				<div class="column is-6">
					<span class="title is-6">Address:</span>
				</div>
				<div class="column is-6">
					<span class="title is-6">View on:</span>
				</div>
			</div>
			<div class="addr-list" v-for="(address,index) in addresses" v-bind:key="index">
				<div class="columns" >
					<div class="column">{{address}}</div>
					<div class="column">
						<div class="columns">
							<div class="column"><a :href="'https://blockstream.info/address/' + address">blockstream.info</a></div>
							<div class="column"><a :href="'https://www.blockchain.com/btc/address/' + address">blockchain.com</a></div>
							<div class="column"><a :href="'https://www.walletexplorer.com/?q=' + address">walletexplorer.com</a></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
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

<style lang="scss" scoped>
	.transaction-headers{
		background-color: gainsboro
	}
	.notification {
		margin-bottom: 1rem !important;
	}
	.addr-list {
		margin-bottom: 1rem;
		border-radius: 4px;
		padding: 1rem;
		background: whitesmoke;
	}
</style>
