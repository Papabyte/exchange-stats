<template>
		<b-row class="main-col">
			<b-col  cols="12">
				<b-row>
					<b-col  cols="3">
						<b-pagination
							v-model="currentPage"
							:total-rows="totalRows"
							per-page="10"
							align="fill"
							size="l"
							class="p-4 my-0"
							></b-pagination> 
						</b-col>
				</b-row>	
			<b-row>
					<b-col  cols="12">
							<b-table 
							:current-page="currentPage"
							per-page="10"
							:items="items"
							:fields="fields"
							:sort-by.sync="sortBy"
							:sort-desc.sync="sortDesc"
							responsive
								sort-icon-left
						>	
							<template v-slot:cell(unit)="data">
									<b-link class="text-break" target="_blank" :href="(isTestnet ? 'https://testnetexplorer.obyte.org/#' : 'https://explorer.obyte.org/#')+data.item.unit">
									{{data.item.unit}}
									</b-link>
							</template>
						</b-table>
					</b-col>
				</b-row>
			</b-col>
		</b-row>	
</template>

<script>

	const conf = require("../conf.js");

	export default {
		components: {
			
		},
		data() {
			return {
				isTestnet : conf.testnet,
				isSpinnerActive: true,
				currentPage:1,
				totalRows:0,
				sortBy: 'age',
				sortDesc: false,
				fields: [
					{ key: 'type', sortable: true ,},
					{ key: 'unit', sortable: true },
					{ key: 'is_stable', sortable: true }
				],
				items: [
				]
			}
		},
		created(){
			this.axios.get('/api/aa_transactions').then((response) => {
				this.items = response.data;
				this.totalRows = this.items.length;
				this.isSpinnerActive= false
			});
		}
	}
</script>

<style >

.main-col{
}

</style>
