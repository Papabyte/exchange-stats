<template>

	<b-row class="main-col">
		<contest-operation-modal :operationItem="clicked_item"/>
		<claim-gain-modal  :operationItem="clicked_item"/>
		<view-url-proofs-modal :operationItem="clicked_item"/>
		<commit-operation-modal :operationItem="clicked_item"/>
		<operation-history-modal :operationItem="clicked_item"/>
		<b-pagination
			v-model="currentPage"
			:total-rows="totalRows"
			per-page="10"
			align="fill"
			size="l"
			class="p-4 my-0"
			></b-pagination> 
		<b-table 
			:current-page="currentPage"
			per-page="10"
			:items="items"
			:fields="fields"
			:sort-by.sync="sortBy"
			:sort-desc.sync="sortDesc"
			responsive
			sort-icon-left>	
				<template v-slot:cell(operation)="data">			
					<i18n v-if="data.item.initial_outcome=='in'" tag="span" path="crowdSourcingOperationsAddXToX" id="action">
						<template #wallet>
							<wallet-id :id="data.item.wallet_id"/>
						</template>
						<template #exchange>
							<exchange :id="data.item.exchange"/>
						</template>
					</i18n>
					<i18n v-else tag="span" path="crowdSourcingOperationsRemoveXFromX" id="action">
						<template #wallet>
							<wallet-id :id="data.item.wallet_id"/>
						</template>
						<template #exchange>
							<exchange :id="data.item.exchange"/>
						</template>
					</i18n>
				</template>
				<template v-slot:cell(outcome)="data">
					{{data.item.outcome == "yes" ? $t("crowdSourcingOperationsYes") : $t("crowdSourcingOperationsNo")}}/>
				</template>
				<template v-slot:cell(staked_on_outcome)="data">
					<byte-amount :amount="data.item.staked_on_outcome" />
				</template>
				<template v-slot:cell(total_staked)="data">
					<byte-amount :amount="data.item.total_staked" />
				</template>
				<template v-slot:cell(action)="data">
				<b-button 
					variant="primary" 
					v-if="data.item.status == 'onreview' && !data.item.is_commitable " 
					v-on:click="clicked_item=data.item;$bvModal.show('contestOperation');" 
					class="mr-2" 
					size="s">{{$t("crowdSourcingOperationsButtonContest")}}</b-button>
				<b-button 
					variant="primary" 
					v-if="data.item.status == 'onreview' && data.item.is_commitable"
					v-on:click="clicked_item=data.item;$bvModal.show('commitOperation');"
					class="mr-2" 
					size="s">{{$t("crowdSourcingOperationsButtonCommit")}}</b-button>
				<b-button 
					variant="primary"
					v-if="data.item.status == 'onreview'"
					v-on:click="clicked_item=data.item;$bvModal.show('viewUrlProofs');"
					class="mr-2" 
					size="s">{{$t("crowdSourcingOperationsButtonViewProofs")}}</b-button>
				<b-button 
					variant="primary" 
					v-if="data.item.status == 'committed' && data.item.claimAddresses.length>0" 
					v-on:click="clicked_item=data.item;$bvModal.show('claimGain');"  
					class="mr-2" size="s" >{{$t("crowdSourcingOperationsButtonClaim")}}</b-button>
													<b-button 
					variant="primary" 
					v-on:click="clicked_item=data.item;$bvModal.show('operationHistory');"  
					class="mr-2" size="s" >{{$t("crowdSourcingOperationsButtonHistory")}}</b-button>
				</template>

			</b-table>
		</b-row>
</template>

<script>
const conf = require("../conf.js");
import ByteAmount from './commons/ByteAmount.vue';
import ContestOperationModal from './commons/ContestOperationModal.vue';
import ClaimGainModal from './commons/ClaimGainModal.vue';
import CommitOperationModal from './commons/CommitModal.vue';
import ViewUrlProofsModal from './commons/ViewUrlProofsModal.vue';
import OperationHistoryModal from './commons/OperationHistoryModal.vue';

import Exchange from './commons/Exchange.vue';
import WalletId from './commons/WalletId.vue';
import moment from 'moment/src/moment'

	export default {
		components: {
			ByteAmount,
			ContestOperationModal,
			ClaimGainModal,
			ViewUrlProofsModal,
			Exchange,
			WalletId,
			CommitOperationModal,
			OperationHistoryModal
		},
		data() {
			return {
				clicked_item: null,
				pools : null,
				isSpinnerActive: true,
				currentPage:1,
				totalRows:0,
				sortBy: 'countdown_start',
				sortDesc: true,
				timerId: null,
				fields: [
					{ key: 'status', sortable: true, label: this.$t('crowdSourcingOperationsTableColStatus')},
					{ key: 'operation', sortable: true, label: this.$t('crowdSourcingOperationsTableColOperation')},
					{ key: 'outcome_yes_or_no', sortable: true, label: this.$t('crowdSourcingOperationsTableColOutcome')},
					{ key: 'staked_on_outcome', sortable: true, label: this.$t('crowdSourcingOperationsTableColStakedOnOutcome')},
					{ key: 'total_staked', sortable: true, label: this.$t('crowdSourcingOperationsTableColTotalStaked')},
					{ key: 'end', sortable: true, label: "end"},

					{ key: 'action', label: this.$t('crowdSourcingOperationsTableColAction') }
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
				this.axios.get('/api/operations').then((response) => {
							this.items = [];
							response.data.forEach((row)=>{
								const item = {};
								item.status = row.status ;
								if (row.initial_outcome == "in"){
									item.outcome_yes_or_no = row.outcome == "in" ? "yes" : "no";
								}
								else {
									item.outcome_yes_or_no = row.outcome == "out" ? "yes" : "no";
								}
								item.outcome= row.outcome;
								item.isRemovingOperation = row.outcome == "out";
								item.initial_outcome = row.initial_outcome;
								item.staked_on_outcome = Number(row.staked_on_outcome);
								item.total_staked = Number(row.total_staked);
								item.wallet_id = Number(row.wallet_id);
								item.exchange = row.exchange;
								item.key = row.key;
								item.url_proofs_by_outcome = row.url_proofs_by_outcome;
								item.countdown_start = row.countdown_start;
								item.staked_on_opposite = Number(row.staked_on_opposite);
								if ((new Date().getTime() / 1000 - row.countdown_start) > conf.challenge_period_length){
									item.is_commitable = true;
									item.end = 'ended';
								} else {
									item.end = moment().to(moment.unix(conf.challenge_period_length  + Number(row.countdown_start)));
								}

								if (item.status == "committed"){
									item.claimAddresses = [];
									const assocStakedByAdress =	row.staked_by_address;
									const outcome = row.outcome
									for (var key in assocStakedByAdress){
										if (assocStakedByAdress[key][outcome])
											item.claimAddresses.push(key);
									}
								}
								this.items.push(item);
								this.totalRows = this.items.length;
							})
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
