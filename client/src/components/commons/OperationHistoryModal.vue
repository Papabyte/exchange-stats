<template>
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">
				<i18n v-if="operationItem.initial_outcome=='in'" tag="span" path="crowdSourcingOperationsAddXToX" id="action">
					<template #wallet>
						<wallet-id :id="operationItem.wallet_id" :showIcon="false" newTab/>
					</template>
					<template #exchange>
						<exchange :id="operationItem.exchange" :showIcon="false" newTab/>
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
			<operation-history :propOperationId="operationItem.operation_id" />
		</section>
		<footer class="modal-card-foot f-end">
			<button class="button" type="button" @click="$parent.close()">{{$t('commonButtonClose')}}</button>
		</footer>
	</div>
</template>

<script>
const conf = require("../../conf.js");
import moment from 'moment/src/moment'
import Exchange from '../commons/Exchange.vue';
import WalletId from '../commons/WalletId.vue';
import OperationHistory from './OperationHistory.vue';

export default {
	components: {
		Exchange,
		WalletId,
		OperationHistory
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
	},

	methods: {

	}
}
</script>

<style lang='scss' scoped>

</style>
