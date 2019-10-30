<template>
		<b-row class="main-col">
			<DonateRewardModal />
			<b-col  cols="12"  >
				<b-row >
					<b-col order-lg="1" offset-lg="4" offset-xs="6" xs="3" lg="3" class="align-lg-bottom">
						<b-button variant="primary" class="text-nowrap mt-3" size="m"  v-b-modal.donateReward>{{$t("crowdSourcingPoolsButtonDonate")}}</b-button>
					</b-col>
					<b-col  xs="8" lg="3">
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
				<b-col  cols="12" class="text-left">
					<b-table 
					:current-page="currentPage"
					per-page="10"
					:items="items"
					:fields="fields"
					responsive
					sort-icon-left>	
						<template v-slot:cell(reward_amount)="data">
							<byte-amount :amount="Number(data.item.reward_amount)" />
						</template>
					</b-table>
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
				timerId: null,
				fields: [
					{ key: 'number_rewards', sortable: true, label: this.$t("crowdSourcingPoolsNbOfRewards")},
					{ key: 'reward_amount', sortable: true, label: this.$t("crowdSourcingPoolsRewardAmount")},
					{ key: 'exchange', sortable: true, label: this.$t("crowdSourcingPoolsExchange")}
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
				this.axios.get('/api/pools').then((response) => {
					this.items = response.data;
					this.totalRows = this.items.length;
					this.isSpinnerActive= false
				});
			}
		}
	}
</script>

<style >

</style>
