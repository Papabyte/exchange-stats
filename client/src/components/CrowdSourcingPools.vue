<template>
		<b-row class="main-col">
			<DonateRewardModal />
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
					sort-icon-left>	
						<template v-slot:cell(reward_amount)="data">
							<byte-amount :amount="Number(data.item.reward_amount)" />
						</template>
					</b-table>
				</b-col>
			</b-row>	
			<b-row>
				<b-col  offset="4" cols="4">
					<b-button variant="primary"  class="mb-2" size="m"  v-b-modal.donateReward>Donate a reward</b-button>
				</b-col>
			</b-row>
		</b-col>
	</b-row>	
</template>

<script>

import ByteAmount from './commons/ByteAmount.vue';
import DonateRewardModal from './commons/DonateRewardModal.vue';

	export default {
		components: {
			ByteAmount,
			DonateRewardModal
		},
		data() {
			return {
				pools : null,
				isSpinnerActive: true,
				currentPage:1,
				totalRows:0,
				sortBy: 'age',
				sortDesc: false,
				fields: [
					{ key: 'number_rewards', label:" Number of rewards", sortable: true ,},
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
					this.totalRows = this.items.length;
					this.isSpinnerActive= false
				});
		}
	}
</script>

<style >

</style>
