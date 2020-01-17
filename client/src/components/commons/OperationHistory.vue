<template>
	<div class="container">
		<div v-if="!isSpinnerActive">
			<div v-if="title">
				<h5 class="title is-5 is-marginless mb-05">
					{{title}}
				</h5>
			</div>
			<div v-for="item in historyItems" class="row" :key="item.operation_id">
				<div>
					<div class="box" v-if="item.operation_type =='stake' || item.operation_type=='initial_stake'" >
						<div class="title is-6"><b>{{item.operation_type =='stake' ? 'Counter stake' : 'Initial stake'}} </b> - {{item.time}}</div>

						<div class="d-block text-break">
							<b><user :address="item.author_address" :nickname="item.author_nickname"/></b>
							staked <b><byte-amount :amount="item.accepted_amount"/></b> on <b>{{item.stake_on}}</b>
						</div>
						<span class="d-block mr-05">Resulting outcome: <b>{{item.resulting_outcome}}</b></span>

						<div v-if="item.proof_urls">
							<div>Provided proofs:</div>
							<div v-for="(url,index) in item.proof_urls" :key="index">
								<a :href="url">{{url}}</a>
							</div>
						</div>

						<span v-if="item.expected_reward" class="d-block">Expected reward: <b><byte-amount :amount="item.expected_reward"/></b></span>
						<div class="progress-stacked mt-1">
							<div class="bar" :style="{ height: 15 + 'px', background: '#48c774', width: ( item.staked_on_yes * 100) / (item.staked_on_yes + item.staked_on_no) + '%' }">
								<byte-amount :amount="item.staked_on_yes"/>
							</div>
							<div class="bar" :style="{ height: 15 + 'px', background: '#f00', width: ( item.staked_on_no * 100) / (item.staked_on_yes + item.staked_on_no) + '%' }">
								<byte-amount :amount="item.staked_on_no"/>
							</div>
						</div>
					</div>
					<div class="box" v-if="item.operation_type =='commit'" >
						<div class="title is-6"><b>Committed</b> - {{item.time}} </div>
						<div class="d-block text-break">
							<span v-if="item.paid_out_amount" class="d-block"><b><byte-amount :amount="item.paid_out_amount"/></b> paid to <b>{{item.paid_out_address}}</b></span>
						</div>
					</div>
					<div class="box" v-if="item.operation_type =='withdraw'" >
						<div class="title is-6"><b>Withdraw</b> - {{item.time}} </div>
						<div class="d-block text-break">
							<span v-if="item.paid_out_amount" class="d-block"><b><byte-amount :amount="item.paid_out_amount"/></b> paid to <b>{{item.paid_out_address}}</b></span>
						</div>
					</div>
				</div>
			</div>
		</div>
		<b-loading label="Spinning" :is-full-page="false" :active.sync="isSpinnerActive" :can-cancel="true"></b-loading>
	</div>
</template>

<script>
const conf = require("../../conf.js");
import moment from 'moment/src/moment'
import ByteAmount from './ByteAmount.vue';
import User from './User.vue';

export default {
	components: {
		ByteAmount,
		User
	},
	props: {
		propOperationId: {
			type: String,
			required: false
		},
		propHistoryData: {
			type: Object,
			required: false
		},
		showTitle: {
			type: Boolean,
			required: false

		}
	},
	data(){
		return {
			historyItems: [],
			isSpinnerActive: false,
			title: null
		}
	},
	created () {
		this.isSpinnerActive = true;
		if (this.propHistoryData){
			this.formatHistory(this.propHistoryData)
		} else {
			this.axios.get('/api/operation-history/'+ this.propOperationId).then((response) => {
				this.formatHistory(response.data)
			});
		}
	},
	methods: {
		formatHistory(objData){
			console.log(objData.history)
			console.log(objData.operation)
			if (this.showTitle){
				if (objData.operation.initial_outcome == 'in')
					this.title = this.$t('crowdSourcingOperationsAddXToX', {wallet: objData.operation.wallet_id, exchange: objData.operation.exchange});
				else
					this.title = this.$t('crowdSourcingOperationsRemoveXFromX', {wallet: objData.operation.wallet_id, exchange: objData.operation.exchange});
			}
		objData.history.forEach((row)=>{
				const item = {};
				item.operation_type = row.operation_type;
				item.author_address = row.response.your_address;
				item.author_nickname = row.response.nickname;
				item.staked_on_yes = row.response['staked_on_' + 	objData.operation.initial_outcome];
				item.staked_on_no = row.response['staked_on_' + (objData.operation.initial_outcome == 'in' ? 'out' : 'in')];
				item.time = moment.unix(row.timestamp).format('LLLL');
				item.stake_on = row.response.proposed_outcome == objData.operation.initial_outcome ? this.$t('crowdSourcingOperationsYes') : this.$t('crowdSourcingOperationsNo');
				item.accepted_amount = row.response.accepted_amount;
				item.resulting_outcome = row.response.resulting_outcome == objData.operation.initial_outcome ? this.$t('crowdSourcingOperationsYes') : this.$t('crowdSourcingOperationsNo');
				item.paid_out_amount = row.response.paid_out_amount;
				item.paid_out_address = row.response.paid_out_address;
				item.expected_reward = row.response.expected_reward;
				item.proof_urls = row.response.proof_urls || null;
				this.historyItems.push(item);
			});
			this.isSpinnerActive = false;
		}
	}
}
</script>

<style lang='scss' scoped>
	.event-block{
		background-color: gainsboro;
	}
	.progress-stacked {
		display: flex;
		border-radius: 4px;
		overflow: hidden;
		.bar {
			position: relative;
			& > span {
				display: block;
				text-align: center;
				line-height: 15px;
				font-weight: bold;
				color: #fff;
			}
		}
	}
	/*.progress-value {*/
	/*	display: flex;*/
	/*	.progress-wrapper {*/

	/*	}*/
	/*}*/
</style>
