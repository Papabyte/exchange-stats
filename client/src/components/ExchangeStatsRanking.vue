<template>
	<b-container fluid>
		<b-row >
		<edit-wallet-modal :propExchange="clicked_exchange" :isRemoving="isRemoving"/>
			<b-col offset-lg="1" lg="10" cols="12" class="py-3">
				<b-row >
					<b-col cols="12" class="py-3">
						<h3>{{$t('rankingTitle')}}</h3>
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

						<template v-slot:head(nb_withdrawal_addresses)="data">
							<span v-b-tooltip.hover :title="$t('rankingTableColNbWithdrawalAddressesTip')">{{data.label}}</span>
						</template>

						<template v-slot:head(nb_deposit_addresses)="data">
							<span v-b-tooltip.hover :title="$t('rankingTableColNbDepositAddressesTip')">{{data.label}}</span>
						</template>

						<template v-slot:head(last_day_deposits)="data">
							<span v-b-tooltip.hover :title="$t('rankingTableColLastDayDepositsTip')">{{data.label}}</span>
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
					<b-pagination
						v-model="currentPage"
						:total-rows="totalRows"
						:per-page="perPage"
						size="l"
						class="p-4 my-0"
					></b-pagination>
				</b-row>
			</b-col>
		</b-row>
	</b-container>
</template>

<script>

import BtcAmount from './commons/BtcAmount.vue';
import EditWalletModal from './commons/EditWalletModal.vue';

	export default {
		components: {
			BtcAmount,
			EditWalletModal
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
					{ key: 'nb_withdrawal_addresses', sortable: true, label: this.$t('rankingTableColNbWithdrawalAddresses')},
					{ key: 'nb_deposit_addresses', sortable: true, label: this.$t('rankingTableColNbDepositAddresses')},
					{ key: 'total_btc_wallet', sortable: true, label: this.$t('rankingTableColTotalBtcWallet')},
					{ key: 'last_day_deposits', sortable: true, label: this.$t('rankingTableColLastDayDeposits')},
					{ key: 'last_day_withdrawals', sortable: true, label: this.$t('rankingTableColLastDayWithdrawals') },
					{ key: 'action', label: this.$t('rankingTableColAction')}
				],
				items: [
				]
			}
		},
		created(){
			this.axios.get('/api/ranking').then((response) => {
				this.totalRows = response.data.length;
				this.items = response.data;
			});
		}
	}
</script>

<style >

</style>
