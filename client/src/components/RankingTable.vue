<template>
	<div>
		<b-table class="ranking-table"
			:items="items"
			:fields="fields"
			:sort-by.sync="sortBy"
			:sort-desc.sync="sortDesc"
			responsive="sm"
		></b-table>

		<div>
			Sorting By: <b>{{ sortBy }}</b>, Sort Direction:
			<b>{{ sortDesc ? 'Descending' : 'Ascending' }}</b>
		</div>
	</div>
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
					{ isActive: true, age: 40, first_name: 'Dickerson', last_bame: 'Macdonald' },
					{ isActive: false, age: 21, first_name: 'Larsen', last_name: 'Shaw' },
					{ isActive: false, age: 89, first_name: 'Geneva', last_name: 'Wilson' },
					{ isActive: true, age: 38, first_name: 'Jami', last_name: 'Carney' }
				]
			}
		}
	}
</script>

<style >

.ranking-table{
}

</style>
