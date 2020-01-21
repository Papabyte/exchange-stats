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
					<div class="box" v-if="item.event_type =='stake' || item.event_type=='initial_stake'" >
						<div class="title is-6"><b>{{item.event_type =='stake' ? 'Counter stake' : 'Initial stake'}} </b> - {{item.time}}
							- Unit: <unit-link :unit="item.unit"/>
						</div>

						<div class="text-break">
							<b><user :address="item.concerned_address" :nickname="item.nickname"/></b>
							staked <b><byte-amount :amount="item.paid_in"/></b> on <b>{{item.stake_on}}</b>
						</div>
						<div>
							<span class="mr-05">{{$t('operationHistoryResultingOutcome')}}<b>{{item.resulting_outcome}}</b></span>
						</div>

						<div v-if="item.event_data.proof_urls">
							<div>Provided proofs:</div>
							<div v-for="(url,index) in item.event_data.proof_urls" :key="index">
								<a :href="url">{{url}}</a>
							</div>
						</div>

						<span v-if="item.event_data.expected_reward" class="is-inline">{{$t('operationHistoryExpectedReward')}}<b><byte-amount :amount="item.event_data.expected_reward"/></b></span>
						<div class="progress-stacked mt-1">
							<div class="bar" :style="{ height: 15 + 'px', background: '#48c774', width: ( item.staked_on_yes * 100) / (item.staked_on_yes + item.staked_on_no) + '%' }">
								<byte-amount :amount="item.staked_on_yes"/>
							</div>
							<div class="bar" :style="{ height: 15 + 'px', background: '#f00', width: ( item.staked_on_no * 100) / (item.staked_on_yes + item.staked_on_no) + '%' }">
								<byte-amount :amount="item.staked_on_no"/>
							</div>
						</div>
					</div>
					<div class="box" v-if="item.event_type =='commit'" >
						<div class="title is-6"><b>{{$t('operationHistoryCommit')}}</b> - {{item.time}} 
						- Unit: <unit-link :unit="item.unit"/>
						</div>
						<div class="is-inline text-break">
							<span v-if="item.paid_out" class="is-inline"><b><byte-amount :amount="item.paid_out"/></b> paid to <b>{{item.concerned_address}}</b></span>
						</div>
					</div>
					<div class="box" v-if="item.event_type =='withdraw'" >
						<div class="title is-6"><b>{{$t('operationHistoryWithdraw')}}</b> - {{item.time}}
							- Unit: <unit-link :unit="item.unit"/>
						</div>
						<div class="is-inline text-break">
							<span v-if="item.paid_out" class="is-inline"><b><byte-amount :amount="item.paid_out"/></b> paid to <b>{{item.concerned_address}}</b></span>
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
import ByteAmount from './ByteAmount.vue'
import UnitLink from './UnitLink.vue'
import User from './User.vue';

export default {
	components: {
		ByteAmount,
		User,
		UnitLink
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

			if (this.showTitle){
				if (objData.operation.initial_outcome == 'in')
					this.title = this.$t('crowdSourcingOperationsAddXToX', {wallet: objData.operation.wallet_id, exchange: objData.operation.exchange});
				else
					this.title = this.$t('crowdSourcingOperationsRemoveXFromX', {wallet: objData.operation.wallet_id, exchange: objData.operation.exchange});
			}
			objData.history.forEach((row)=>{
				row.staked_on_yes = row.event_data['staked_on_' + 	objData.operation.initial_outcome];
				row.staked_on_no = row.event_data['staked_on_' + (objData.operation.initial_outcome == 'in' ? 'out' : 'in')];
				row.time = moment.unix(row.timestamp).format('LLLL');
				row.stake_on = row.event_data.proposed_outcome == objData.operation.initial_outcome ? this.$t('crowdSourcingOperationsYes') : this.$t('crowdSourcingOperationsNo');
				row.resulting_outcome = row.event_data.resulting_outcome == objData.operation.initial_outcome ? this.$t('crowdSourcingOperationsYes') : this.$t('crowdSourcingOperationsNo');
			});
			this.historyItems = objData.history
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
