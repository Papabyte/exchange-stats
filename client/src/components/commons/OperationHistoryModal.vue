<template>
	<b-modal id="operationHistory" hide-footer>
 		 <template v-slot:modal-title>	
					<i18n v-if="operationItem.initial_outcome=='in'" tag="span" path="crowdSourcingOperationsAddXToX" id="action">
						<template #wallet>
							<wallet-id :id="operationItem.wallet_id" :showIcon="false"/>
						</template>
						<template #exchange>
							<exchange :id="operationItem.exchange" :showIcon="false"/>
						</template>
					</i18n>
					<i18n v-else tag="span" path="crowdSourcingOperationsRemoveXFromX" id="action">
						<template #wallet>
							<wallet-id :id="operationItem.wallet_id" :showIcon="false"/>
						</template>
						<template #exchange>
							<exchange :id="operationItem.exchange" :showIcon="false"/>
						</template>
					</i18n>
		</template>
		<b-container>
			<b-row v-for="item in historyItems" class="my-4" :key="item.operation_id">
				<b-col cols="12">
					<b-row v-if="item.operation_type =='stake' || item.operation_type=='initial_stake'" class="m-y-3">
						<b-col cols="12">
							<b-progress  :max="item.staked_on_yes + item.staked_on_no" show-value height="1.5rem">
								<b-progress-bar :value="item.staked_on_yes" variant="success"><b><byte-amount :amount="item.staked_on_yes"/></b> </b-progress-bar>
								<b-progress-bar :value="item.staked_on_no" variant="danger"><b><byte-amount :amount="item.staked_on_no"/></b> </b-progress-bar>
							</b-progress>
							<div class="event-block pt-2">
							{{item.time}}
							<b>{{item.author}}</b> staked <b><byte-amount :amount="item.stake_amount"/></b> on <b>{{item.stake_on}}</b>
							</div>
						</b-col>
					</b-row>
				</b-col>
			</b-row>
		</b-container>
	</b-modal>
</template>

<script>
const conf = require("../../conf.js");
import moment from 'moment/src/moment'
import Exchange from '../commons/Exchange.vue';
import WalletId from '../commons/WalletId.vue';
import ByteAmount from '../commons/ByteAmount.vue';

export default {	
	components: {
		Exchange,
		WalletId,
		ByteAmount
	},
	props: {
		operationItem: {
			type: Object,
			required: false,
			default:  function () {
				return {}
			}
		}
	},
	data(){
		return {
			historyItems: []
		}
	},
	watch:{
		operationItem: function(){
			this.historyItems= [];
			this.getHistory();
		}
	},
	methods:{
		getHistory(){
			if (this.operationItem.key)
				this.axios.get('/api/operation-history/'+ encodeURIComponent(this.operationItem.key)).then((response) => {
					response.data.forEach((row)=>{
						const item = {};
						item.operation_type = row.operation_type;
						item.author = row.response.your_address;
						item.staked_on_yes = Number(row.response['staked_on_' + this.operationItem.initial_outcome]);
						item.staked_on_no = Number(row.response['staked_on_' + (this.operationItem.initial_outcome == 'in' ? 'out' : 'in')]);
						item.time = moment.unix(row.timestamp).format('LLLL');
						item.stake_on = row.response.proposed_outcome == this.operationItem.initial_outcome ? 'yes' : 'no';
						item.stake_amount = Number(row.response.your_stake);
						this.historyItems.push(item);
						
					});

					 
				});
		}
	}
}
</script>

<style lang='scss' scoped>
.event-block{
	background-color: gainsboro
}
</style>