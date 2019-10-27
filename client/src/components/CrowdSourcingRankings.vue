<template>
		<b-row class="main-col">
			<b-col cols="12">
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
						<template v-slot:cell(income)="data">
							<byte-amount :isNegative="data.item.income<0" :isPositive="data.item.income>0" :amount="data.item.income"/>
						</template>
						</b-table>
					</b-col>
				</b-row>
			</b-col>
		</b-row>	
</template>

<script>

	const conf = require("../conf.js");
	import ByteAmount from './commons/ByteAmount.vue';

	export default {
		components: {
			ByteAmount
		},
		data() {
			return {
				isTestnet : conf.testnet,
				isSpinnerActive: true,
				currentPage:1,
				totalRows:0,
				sortBy: 'initiatives',
				sortDesc: true,
				fields: [
					{ key: 'address', sortable: true},
					{ key: 'initiatives', sortable: true },
					{ key: 'successes', sortable: true },
					{ key: 'income', label:"Profit/Loss", sortable: true }
				],
				items: [
				]
			}
		},
		created(){
			this.getData();
			this.timerId = setInterval(this.getData, 60000);
		},
		beforeDestroy(){
			clearInterval(this.timerId);
		},
		methods:{
			getData(){
				this.axios.get('/api/contributors-ranking/').then((response) => {
					this.items = response.data;
					this.totalRows = this.items.length;
					this.isSpinnerActive= false
				});
			}
		}
	}
</script>

<style >

.main-col{
}

</style>
