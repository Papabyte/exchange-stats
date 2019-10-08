<template>
	<b-container fluid>
		<ContestOperationModal :prop_operation_item="clicked_item"/>
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
						<template v-slot:cell(operation)="data">
							Add wallet {{data.item.wallet_id}} to {{data.item.exchange}}?
						</template>

						<template v-slot:cell(staked_on_outcome)="data">
							<ByteAmount :amount="data.item.staked_on_outcome" />
						</template>
						<template v-slot:cell(total_staked)="data">
							<ByteAmount :amount="data.item.total_staked" />
						</template>
						<template v-slot:cell(action)="data">
						<b-button v-if="data.item.status == 'onreview' && !data.item.is_commitable" v-on:click="clicked_item=data.item" class="mr-2" size="s" v-b-modal.contestOperation>contest</b-button>
						<b-button v-if="data.item.status == 'onreview' && data.item.is_commitable" v-on:click="commit(data.item)" class="mr-2" size="s">commit</b-button>
						<b-button v-if="data.item.status == 'onreview'"  class="mr-2" size="s">view proofs</b-button>
						<b-button v-if="data.item.status == 'committed'" v-on:click="claim(data.item)" class="mr-2" size="s">claim a gain</b-button>

						</template>
					</b-table>
						</b-row>
	</b-container>
</template>

<script>
const conf = require("../conf.js");
import ByteAmount from './commons/ByteAmount.vue';
import ContestOperationModal from './commons/ContestOperationModal.vue';

	export default {
		components: {
			ByteAmount,
			ContestOperationModal
		},
		data() {
			return {
				clicked_item: null,
				pools : null,
				isSpinnerActive: true,
					currentPage:0,
				totalRows:0,
				sortBy: 'age',
				sortDesc: false,
				fields: [
					{ key: 'status', sortable: true },
					{ key: 'operation', sortable: true },
					{ key: 'outcome', sortable: true },

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
				this.axios.get('/api/challenges').then((response) => {
					console.log("challenges " +JSON.stringify(response.data));
					response.data.forEach((row)=>{
						const item = {};
						//if (row.status == "onreview"){
							item.status = row.status ;
							if (row.initial_outcome == "in"){
								item.operation = "Add wallet " + row.wallet_id + " to exchange " + row.wallet_id +"?";
								item.outcome = row.outcome == "in" ? "yes" : "no";
							}
							else {
								item.operation = "Remove wallet " + row.wallet_id + " from exchange " + row.wallet_id +"?";
								item.outcome = row.outcome == "out" ? "yes" : "no";
							}
							item.isRemovingOperation = row.outcome == "out";
							item.initial_outcome = row.initial_outcome;
							item.staked_on_outcome = row.staked_on_outcome;
							item.total_staked = row.total_staked;
							item.wallet_id = row.wallet_id;
							item.exchange = row.exchange;
							if ((new Date().getTime() / 1000 - row.countdown_start) > conf.challenge_period_length){
								item.is_commitable = true;
							}
					//	}
						this.items.push(item);
						
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
			},
			claim(item){
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
