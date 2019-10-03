<template>
	<b-container fluid>
		<b-row >
			<b-col offset-lg="1" lg="10" cols="12" class="py-3">
				<h3 class="text-center">On-chain activity ranking</h3>
			</b-col>
		</b-row >
		<b-row >
			<b-col offset-lg="1" lg="10" cols="12">
				<b-table class="ranking-table "
				:items="items"
				:fields="fields"
				:sort-by.sync="sortBy"
				:sort-desc.sync="sortDesc"
				responsive
				sort-icon-left
				>      <template v-slot:cell(total_btc_wallet)="data">

     		 <BtcAmount :amount="data.item.total_btc_wallet"/>
      </template>
			  <template v-slot:cell(cmc_volume)="data">

     		 <BtcAmount :amount="data.item.total_btc_wallet"/>
      </template>
			
			      <template v-slot:cell(action)="data">
							  <b-link :to="'/explorer/'+ data.item.exchange_id">
        <b-button size="sm"  class="mr-2">
Explore wallets        </b-button></b-link>
			      </template>

			</b-table>
			</b-col>
		</b-row>
	</b-container>
</template>

<script>

import BtcAmount from './commons/BtcAmount.vue';

	export default {
		components: {
			BtcAmount
		},
		data() {
			return {
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
				this.axios.get('/ranking').then((response) => {
					console.log(response.data);
					this.items = response.data;
				});


		}
	}
</script>

<style >

.ranking-table{
}

</style>
