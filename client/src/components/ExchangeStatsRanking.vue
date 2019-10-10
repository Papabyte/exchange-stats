<template>
	<b-container fluid>
		<b-row >
		<EditWalletModal :prop_exchange="clicked_exchange"/>
			<b-col offset-lg="1" lg="10" cols="12" class="py-3">
				<b-row >
					<b-col cols="12" class="py-3">
						<h3 class="text-center">On-chain activity ranking</h3>
					</b-col >
				</b-row >
				<b-row class="main-col">
					<b-pagination
					v-model="currentPage"
					:total-rows="totalRows"
					:per-page="perPage"
					align="fill"
					size="l"
					class="pl-4 my-0"
					></b-pagination> 
					<b-table 
					:current-page="currentPage"
					:per-page="perPage"
					:items="items"
					:fields="fields"
					:sort-by.sync="sortBy"
					:sort-desc.sync="sortDesc"
					responsive
					sort-icon-left
					>
						<template v-slot:cell(total_btc_wallet)="data">
							<BtcAmount v-if="data.item.total_btc_wallet" :amount="data.item.total_btc_wallet"/>
						</template>
						<template v-slot:cell(reported_volume)="data">
							<BtcAmount :amount="data.item.reported_volume"/>
						</template>
						<template v-slot:cell(action)="data">
							<b-link v-if="data.item.total_btc_wallet"  :to="'/explorer/'+ data.item.exchange_id">
								<b-button variant="primary" size="sm"  class="mr-2">
									Explore wallet
								</b-button>
							</b-link>
							<b-button variant="primary" size="sm"  v-on:click="clicked_exchange=data.item.exchange_id" v-b-modal.editWallet>Add wallet</b-button>
						</template>
					</b-table>
				</b-row>
			</b-col>
		</b-row>
	</b-container>
</template>

<script>

import BtcAmount from './commons/BtcAmount.vue';
import EditWalletModal from './commons/EditWalletModal.vue';

	export default {
		components: {
			BtcAmount,
			EditWalletModal
		},
		data() {
			return {
				clicked_exchange: null,
				currentPage:1,
				totalRows:0,
				perPage: 30,
				sortBy: 'total_btc_wallet',
				sortDesc: true,
				fields: [
					{ key: 'name', sortable: true ,},
					{ key: 'reported_volume', sortable: true },
					{ key: 'nb_withdrawal_addresses', sortable: true },
					{ key: 'nb_deposit_addresses', sortable: true },
					{ key: 'total_btc_wallet', sortable: true },
					{ key: 'last_day_deposits', sortable: true },
					{ key: 'last_day_withdrawals', sortable: true },
					{ key: 'action'}
				],
				items: [
				]
			}
		},
		created(){
				this.axios.get('/api/ranking').then((response) => {
					console.log(response.data);
					this.totalRows = response.data.length;
					this.items = response.data;
					
				});


		}
	}
</script>

<style >

.main-col{
}

</style>
