<template>
	<b-container fluid>
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
					</b-table>
						</b-row>
	</b-container>
</template>

<script>


	export default {
		components: {
			
		},
		data() {
			return {
				pools : null,
				isSpinnerActive: true,
					currentPage:0,
				totalRows:0,
				sortBy: 'age',
				sortDesc: false,
				fields: [
					{ key: 'number_rewards', sortable: true ,},
					{ key: 'reward_amount', sortable: true },
					{ key: 'exchange', sortable: true }
				],
				items: [
				]
			}
		},
		created(){
				this.axios.get('/api/pools').then((response) => {
					console.log(response.data);
					this.items = response.data;
					this.isSpinnerActive= false
				});


		}
	}
</script>

<style >

.main-col{
}

</style>
