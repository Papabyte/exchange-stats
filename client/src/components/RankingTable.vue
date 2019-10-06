<template>
	<b-container fluid>
		<b-row >
		<AddWalletModal :exchange="clicked_exchange"/>
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
					per-page="30"
					align="fill"
					size="l"
					class="pl-4 my-0"
					></b-pagination> 
					<b-table 
					:current-page="currentPage"
					per-page="30"
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
						<template v-slot:cell(cmc_volume)="data">
							<BtcAmount :amount="data.item.cmc_volume"/>
						</template>
						<template v-slot:cell(action)="data">
							<b-link v-if="data.item.total_btc_wallet"  :to="'/explorer/'+ data.item.exchange_id">
								<b-button size="sm"  class="mr-2">
									Explore wallet
								</b-button>
							</b-link>
										  <b-button v-else size="sm"  v-on:click="clicked_exchange=data.item.exchange_id" v-b-modal.addWallet>Add wallet</b-button>



						</template>
					</b-table>
				</b-row>
			</b-col>
		</b-row>
	</b-container>
</template>

<script>

import BtcAmount from './commons/BtcAmount.vue';
import AddWalletModal from './commons/AddWalletModal.vue';

	export default {
		components: {
			BtcAmount,
			AddWalletModal
		},
		data() {
			return {
				clicked_exchange: null,
				currentPage:0,
				totalRows:0,
				sortBy: 'age',
				sortDesc: false,
				fields: [
					{ key: 'name', sortable: true ,},
					{ key: 'cmc_volume', sortable: true },
					{ key: 'nb_users', sortable: true },
					{ key: 'total_btc_wallet', sortable: true },
					{ key: 'last_day_deposits', sortable: true },
					{ key: 'last_day_withdrawals', sortable: true },
					{ key: 'delivered_by_traded', sortable: true, label:'Delivered by traded ratio' },
					{ key: 'MAU', sortable: true },
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
