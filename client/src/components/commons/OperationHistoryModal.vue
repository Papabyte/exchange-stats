<template>
	<b-modal id="operationHistory" hide-footer scrollable>
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
			<div v-if="!isSpinnerActive">
			<b-row v-for="item in historyItems" class="pb-3 my-4 border" :key="item.operation_id">
				<b-col cols="12">
					<b-row v-if="item.operation_type =='stake' || item.operation_type=='initial_stake'" >
						<b-col cols="12">
							<span class="d-block event-block"><b>{{item.operation_type =='stake' ? 'Counter stake' : 'Initial stake'}} </b> - {{item.time}} </span>
	
							<div class="pt-2">
								<span class="d-block text-break"><b><user :address="item.author_address" :nickname="item.author_nickname"/></b> staked <b><byte-amount :amount="item.accepted_amount"/></b> on <b>{{item.stake_on}}</b></span>
								<span class="d-block">Resulting outcome: <b>{{item.resulting_outcome}}</b></span>
								<span v-if="item.expected_reward" class="d-block">Expected reward: <b><byte-amount :amount="item.expected_reward"/></b></span>
								<b-progress :max="item.staked_on_yes + item.staked_on_no" show-value height="1.5rem" class="mt-1">
									<b-progress-bar :value="item.staked_on_yes" variant="success"><b><byte-amount :amount="item.staked_on_yes"/></b> </b-progress-bar>
									<b-progress-bar :value="item.staked_on_no" variant="danger"><b><byte-amount :amount="item.staked_on_no"/></b> </b-progress-bar>
								</b-progress>
							</div>
						</b-col>
					</b-row>
					<b-row v-if="item.operation_type =='commit'">
						<b-col cols="12">
							<span class="d-block event-block"><b>Committed</b> - {{item.time}} </span>
							<div class="pt-2">
							<span v-if="item.paid_out_amount" class="d-block"><b><byte-amount :amount="item.paid_out_amount"/></b> paid to <b>{{item.paid_out_address}}</b></span>
							</div>
						</b-col>
					</b-row>
					<b-row v-if="item.operation_type =='withdraw'" >
						<b-col cols="12">
							<span class="d-block event-block"><b>Withdraw</b> - {{item.time}} </span>
							<div class="pt-2">
							<span v-if="item.paid_out_amount" class="d-block"><b><byte-amount :amount="item.paid_out_amount"/></b> paid to <b>{{item.paid_out_address}}</b></span>
							</div>
						</b-col>
					</b-row>
				</b-col>
			</b-row>
			</div>
			<div v-if="isSpinnerActive" class="text-center w-100">
					<b-spinner label="Spinning"></b-spinner>
			</div>
		</b-container>
	</b-modal>
</template>

<script>
const conf = require("../../conf.js");
import moment from 'moment/src/moment'
import Exchange from '../commons/Exchange.vue';
import WalletId from '../commons/WalletId.vue';
import ByteAmount from './ByteAmount.vue';
import User from './User.vue';

export default {	
	components: {
		Exchange,
		WalletId,
		ByteAmount,
		User
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
			historyItems: [],
			isSpinnerActive: false,
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
			if (this.operationItem.key){
				this.isSpinnerActive = true;
				this.axios.get('/api/operation-history/'+ encodeURIComponent(this.operationItem.key)).then((response) => {
					response.data.forEach((row)=>{
						const item = {};
						item.operation_type = row.operation_type;
						item.author_address = row.response.your_address;
						item.author_nickname = row.response.nickname;
						item.staked_on_yes = Number(row.response['staked_on_' + this.operationItem.initial_outcome]);
						item.staked_on_no = Number(row.response['staked_on_' + (this.operationItem.initial_outcome == 'in' ? 'out' : 'in')]);
						item.time = moment.unix(row.timestamp).format('LLLL');
						item.stake_on = row.response.proposed_outcome == this.operationItem.initial_outcome ? this.$t('crowdSourcingOperationsYes') : this.$t('crowdSourcingOperationsNo');
						item.accepted_amount = Number(row.response.accepted_amount);
						item.resulting_outcome = row.response.outcome == this.operationItem.initial_outcome ? this.$t('crowdSourcingOperationsYes') : this.$t('crowdSourcingOperationsNo');
						item.paid_out_amount = Number(row.response.paid_out_amount);
						item.paid_out_address = row.response.paid_out_address;
						item.expected_reward = Number(row.response.expected_reward);
						this.historyItems.push(item);
						this.isSpinnerActive = false;
					});
				});
			}
		}
	}
}
</script>

<style lang='scss' scoped>
.event-block{
	background-color: gainsboro;
}
</style>