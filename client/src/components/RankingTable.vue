<template>
	<b-container fluid>
		<b-row >
			<b-col offset-lg="1" lg="10" cols="12" class="py-3">
				<h3 class="text-center">On-chain activity ranking</h3>
			</b-col>
		</b-row >
		<b-row >
			<b-col offset-lg="1" lg="10" cols="12">
				<b-table class="ranking-table"
				:items="items"
				:fields="fields"
				:sort-by.sync="sortBy"
				:sort-desc.sync="sortDesc"
				responsive
				></b-table>
			</b-col>
		</b-row>
	</b-container>
</template>

<script>
	export default {
		data() {
			return {
				sortBy: 'age',
				sortDesc: false,
				fields: [
					{ key: 'name', sortable: true },
					{ key: 'CMC_volume', sortable: true },
					{ key: '#_users', sortable: true },
					{ key: 'Total_BTC_wallet', sortable: true },
					{ key: '24h_deposits', sortable: true },
					{ key: '24h_withdrawals', sortable: true },
					{ key: 'delivered/traded', sortable: true },
					{ key: 'MAU', sortable: true }

				],
				items: [
					{ name: 'Bitstamp', CMC_volume:'1220'},
					{ name: 'Bittrex', CMC_volume:'12200'},
					{ name: 'Kraken', CMC_volume:'12200'},
					{ name: 'Coinbase', CMC_volume:'12200'},
				]
			}
		}
	}
</script>

<style >

.ranking-table{
}

</style>
