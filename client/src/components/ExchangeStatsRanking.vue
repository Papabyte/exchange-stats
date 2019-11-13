<template>
	<b-container fluid>
		<b-row >
		<edit-wallet-modal :propExchange="clicked_exchange" :isRemoving="isRemoving"/>
			<b-col offset-lg="1" lg="10" cols="12" class="py-3">
				<b-row >
					<b-col cols="12" class="py-3">
						<h3 class="text-center">{{$t('rankingTitle')}}</h3>
					</b-col >
				</b-row >
				<b-row class="main-block">
					<b-pagination
					v-model="currentPage"
					:total-rows="totalRows"
					:per-page="perPage"
					size="l"
					class="p-4 my-0"
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
						<template v-slot:head(reported_volume)="data">
							<span v-b-tooltip.hover :title="$t('rankingTableColReportedVolumeTip')">{{data.label}}</span>
						</template>

						<template v-slot:head(last_month_volume)="data">
							<span v-b-tooltip.hover :title="$t('rankingTableColMonthlyTip')">{{data.label}}</span>
						</template>

						<template v-slot:head(nb_addresses)="data">
							<span v-b-tooltip.hover :title="$t('rankingTableColNbAddressesTip')">{{data.label}}</span>
						</template>

						<template v-slot:head(last_day_deposits)="data">
							<span v-b-tooltip.hover :title="$t('rankingTableColLastDayDepositsTip')">{{data.label}}</span>
						</template>

						<template v-slot:cell(last_month_volume)="data">
								<BtcAmount v-if="data.item.last_month_volume" :amount="data.item.last_month_volume"/>
							</template>

						<template v-slot:cell(last_day_deposits)="data">
							<BtcAmount v-if="data.item.last_day_deposits" :amount="data.item.last_day_deposits"/>
						</template>

						<template v-slot:head(last_day_withdrawals)="data">
							<span v-b-tooltip.hover :title="$t('rankingTableColLastDayWithdrawalsTip')">{{data.label}}</span>
						</template>

						<template v-slot:cell(last_day_withdrawals)="data">
							<BtcAmount v-if="data.item.last_day_withdrawals" :amount="data.item.last_day_withdrawals"/>
						</template>

						<template v-slot:head(trend)="data">
							<span v-b-tooltip.hover :title="$t('rankingTableColTrendTip')">{{data.label}}</span>
						</template>
						
						<template v-slot:cell(trend)="data">
							<router-link :to="{name: 'exchangesStats', params: { exchange: data.item.exchange_id } }">
							<exchange-trend v-if="data.item.trend" :data="data.item.trend"/>
							</router-link>
						</template>

						<template v-slot:head(total_btc_wallet)="data">
							<span v-b-tooltip.hover :title="$t('rankingTableColTotalBtcWalletTip')">{{data.label}}</span>
						</template>

						<template v-slot:cell(total_btc_wallet)="data">
							<BtcAmount v-if="data.item.total_btc_wallet" :amount="data.item.total_btc_wallet"/>
						</template>
						<template v-slot:cell(reported_volume)="data">
							<BtcAmount :amount="data.item.reported_volume"/>
						</template>
						<template v-slot:cell(action)="data">
							<b-button-group class="mr-2">
									<b-link v-if="data.item.total_btc_wallet || data.item.nb_withdrawal_addresses"  :to="'/explorer/'+ data.item.exchange_id">
									<b-button  variant="primary" size="m" class="text-nowrap">
										{{$t('rankingTableButtonExploreWallet')}}
									</b-button>
								</b-link>
									<b-dropdown right :text="$t('rankingTableButtonEdit')" variant="primary" size="m" >
										<b-dropdown-item  v-on:click="isRemoving=false;clicked_exchange=data.item.exchange_id;$bvModal.show('editWallet');">{{$t('rankingTableButtonAddWallet')}}</b-dropdown-item>
										<b-dropdown-item v-if="data.item.total_btc_wallet || data.item.nb_withdrawal_addresses" v-on:click="isRemoving=true;clicked_exchange=data.item.exchange_id;$bvModal.show('editWallet');">{{$t('rankingTableButtonRemoveWallet')}}</b-dropdown-item>
									</b-dropdown>
								</b-button-group>
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
import ExchangeTrend from './commons/ExchangeTrend.vue';

	export default {
		components: {
			BtcAmount,
			EditWalletModal,
			ExchangeTrend
		},
		data() {
			return {
				isRemoving: false,
				clicked_exchange: null,
				currentPage:1,
				totalRows:0,
				perPage: 30,
				sortBy: 'total_btc_wallet',
				sortDesc: true,
				fields: [
					{ key: 'name', sortable: true, label: this.$t('rankingTableColName')},
					{ key: 'reported_volume', sortable: true, label: this.$t('rankingTableColReportedVolume')},
					{ key: 'last_month_volume', sortable: true, label: this.$t('rankingTableColMonthlyVolume')},
					{ key: 'nb_addresses', sortable: true, label: this.$t('rankingTableColNbAddresses')},
					{ key: 'total_btc_wallet', sortable: true, label: this.$t('rankingTableColTotalBtcWallet')},
					{ key: 'last_day_deposits', sortable: true, label: this.$t('rankingTableColLastDayDeposits')},
					{ key: 'last_day_withdrawals', sortable: true, label: this.$t('rankingTableColLastDayWithdrawals') },
					{ key: 'trend', label:this.$t('rankingTableColTrend')},
					{ key: 'action', label: this.$t('rankingTableColAction')},

				],
				items: [
				]
			}
		},
		created(){
			this.axios.get('/api/ranking').then((response) => {
				this.totalRows = response.data.length;
				response.data.forEach(function(row){
					if(row.trend)
						row.trend = row.trend.split("@").map(function(value){return Number(value)});
				});
				this.items = response.data;
			});
		}
	}
</script>

<style >

</style>
