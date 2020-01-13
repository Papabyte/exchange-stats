<template>
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">
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
			</p>
			<button class="delete" aria-label="close" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="container">
				<div v-if="!isSpinnerActive">
					<div v-for="item in historyItems" class="row" :key="item.operation_id">
						<div>
							<div class="box" v-if="item.operation_type =='stake' || item.operation_type=='initial_stake'" >
								<div class="title is-6"><b>{{item.operation_type =='stake' ? 'Counter stake' : 'Initial stake'}} </b> - {{item.time}}</div>

								<div class="d-block text-break">
									<b><user :address="item.author_address" :nickname="item.author_nickname"/></b>
									staked <b><byte-amount :amount="item.accepted_amount"/></b> on <b>{{item.stake_on}}</b>
								</div>
								<span class="d-block">Resulting outcome: <b>{{item.resulting_outcome}}</b></span>
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
		</section>
		<footer class="modal-card-foot f-end">
			<button class="button" type="button" @click="$parent.close()">Close</button>
		</footer>
	</div>
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
	created () {
		this.getHistory();
	},
	watch:{
		operationItem: function(){
			this.historyItems = [];
			this.getHistory();
		}
	},
	methods: {
		getHistory(){
			if (this.operationItem.key){
				this.isSpinnerActive = true;
				this.axios.get('/api/operation-history/'+ encodeURIComponent(this.operationItem.key)).then((response) => {
					response.data.forEach((row)=>{
						console.log(row)
						const item = {};
						item.operation_type = row.operation_type;
						item.author_address = row.response.your_address;
						item.author_nickname = row.response.nickname;
						item.staked_on_yes = row.response['staked_on_' + this.operationItem.initial_outcome];
						item.staked_on_no = row.response['staked_on_' + (this.operationItem.initial_outcome == 'in' ? 'out' : 'in')];
						item.time = moment.unix(row.timestamp).format('LLLL');
						item.stake_on = row.response.proposed_outcome == this.operationItem.initial_outcome ? this.$t('crowdSourcingOperationsYes') : this.$t('crowdSourcingOperationsNo');
						item.accepted_amount = row.response.accepted_amount;
						item.resulting_outcome = row.response.resulting_outcome == this.operationItem.initial_outcome ? this.$t('crowdSourcingOperationsYes') : this.$t('crowdSourcingOperationsNo');
						item.paid_out_amount = row.response.paid_out_amount;
						item.paid_out_address = row.response.paid_out_address;
						item.expected_reward = row.response.expected_reward;
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
