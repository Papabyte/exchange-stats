<template>

	<b-row class="main-col">
		<ContestOperationModal :prop_operation_item="clicked_item"/>
		<ClaimGainModal  :prop_operation_item="clicked_item"/>
		<ViewUrlProofsModal :prop_operation_item="clicked_item"/>
		<CommitOperationModal :prop_operation_item="clicked_item"/>
		<b-pagination
			v-model="currentPage"
			:total-rows="totalRows"
			per-page="10"
			align="fill"
			size="l"
			class="pl-4 my-0"
			></b-pagination> 
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
				<template v-slot:cell(operation)="data">
					<span v-if="data.item.initial_outcome=='in'"> Add wallet <WalletId :id="data.item.wallet_id"/> to <Exchange :id="data.item.exchange"/>?</span>
					<span v-else>Remove wallet <WalletId :id="data.item.wallet_id"/> from <Exchange :id="data.item.exchange"/>?</span>
				</template>

				<template v-slot:cell(staked_on_outcome)="data">
					<ByteAmount :amount="data.item.staked_on_outcome" />
				</template>
				<template v-slot:cell(total_staked)="data">
					<ByteAmount :amount="data.item.total_staked" />
				</template>
				<template v-slot:cell(action)="data">
				<b-button 
					variant="primary" 
					v-if="data.item.status == 'onreview' && !data.item.is_commitable " 
					v-on:click="clicked_item=data.item;$bvModal.show('contestOperation');" 
					class="mr-2" 
					size="s">contest</b-button>
				<b-button 
					variant="primary" 
					v-if="data.item.status == 'onreview' && data.item.is_commitable"
					v-on:click="clicked_item=data.item;$bvModal.show('commitOperation');"
					class="mr-2" 
					size="s">commit</b-button>
				<b-button 
					variant="primary"
					v-if="data.item.status == 'onreview'"
					v-on:click="clicked_item=data.item;$bvModal.show('viewUrlProofs');"
					class="mr-2" 
					size="s">view proofs</b-button>
				<b-button 
					variant="primary" 
					v-if="data.item.status == 'committed' && data.item.claimAddresses.length>0" 
					v-on:click="clicked_item=data.item;$bvModal.show('claimGain');"  
					class="mr-2" size="s" >claim a gain</b-button>
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
import Exchange from './commons/Exchange.vue';
import WalletId from './commons/WalletId.vue';


	export default {
		components: {
			ByteAmount,
			ContestOperationModal,
			ClaimGainModal,
			ViewUrlProofsModal,
			Exchange,
			WalletId,
			CommitOperationModal
		},
		data() {
			return {
				clicked_item: null,
				pools : null,
				isSpinnerActive: true,
				currentPage:1,
				totalRows:0,
				sortBy: 'age',
				sortDesc: false,
				fields: [
					{ key: 'status', sortable: true },
					{ key: 'operation', sortable: true },
					{ key: 'outcome_yes_or_no',label:'Outcome', sortable: true },

					{ key: 'staked_on_outcome', sortable: true },
					{ key: 'total_staked', sortable: true },
					{ key: 'action' }

				],
				items: [
				]
			}
		},
		created(){
				this.items = [];
				this.axios.get('/api/operations').then((response) => {
					console.log(JSON.stringify(	response.data));
					response.data.forEach((row)=>{
						const item = {};
						//if (row.status == "onreview"){
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
							item.staked_on_outcome = row.staked_on_outcome;
							item.total_staked = row.total_staked;
							item.wallet_id = row.wallet_id;
							item.exchange = row.exchange;
							item.key = row.key;
							item.url_proofs_by_outcome = row.url_proofs_by_outcome;
							if ((new Date().getTime() / 1000 - row.countdown_start) > conf.challenge_period_length){
								item.is_commitable = true;
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
		},
		methods:{

			commit(item){
				const base64url = require('base64url');
				const data = {
						number_of_rewards: this.nb_reward,
						exchange: item.exchange,
						commit: true
				};
				if (item.initial_outcome == "in")
					data.add_wallet_id= item.wallet_id;
				else
					data.remove_wallet_id= item.wallet_id;

				const json_string = JSON.stringify(data);
				const base64data = base64url(json_string);
				const href = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount=10000&base64data="+base64data;
				window.open(href, '_blank');
			}

		}
	}
</script>

<style >

.main-col{
}

</style>
