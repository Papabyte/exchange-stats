<template>
	<div :class="{bordered: !no_border}" class="py-4">
		<b-row>
			<b-col  cols="6" >
				<TxId label="Transaction: " :tx_id="tx_id"/>
			</b-col>
			<b-col  cols="3" class="text-center" >
				Time: {{transaction.time}}
			</b-col>
			<b-col  cols="3" class="text-center" >
				Block: {{transaction.height}}
			</b-col>
		</b-row>
		<b-row>
			<b-col  cols="5" class="py-3 text-left">
				<div class="w-100 px-4">
					<WalletId v-if="transaction.from && transaction.from.id" label="Wallet: " :id="transaction.from.id"/>
					<span v-if="transaction.from.exchange"><Exchange label="Exchange: " :id="transaction.from.exchange"/></span>
					<btc-amount v-if="transaction.from && transaction.from.amount" label="Amount: " :amount="transaction.from.amount" :isNegative="about_ids.indexOf(transaction.from.id)>-1"/>
				</div>
			</b-col>
			<b-col cols="2" class="text-center">
				<div class="centered">
					<v-icon name='arrow-right' class="custom-icon"/>
				</div>
			</b-col>
			<b-col  cols="5" class="py-3 text-left">
				<div  v-for="(t_out,index) in transaction.to" :key="index" class="py-2">
					<WalletId v-if="t_out.id" label="Wallet: " :id="t_out.id"/>
					<span v-else>Wallet: unknown yet</span>
					<span v-if="t_out.exchange"><Exchange label="Exchange: " :id="t_out.exchange"/></span>
					<BtcAddress v-if="t_out.address" label="Address: " :address="t_out.address"/>
					<btc-amount label="Amount: " :amount="t_out.amount" :isPositive="about_ids.indexOf(t_out.id)>-1"/>
				</div>
			</b-col>
		</b-row >
	</div>
</template>

<script>
//commons
import BtcAmount from './commons/BtcAmount.vue';
import WalletId from './commons/WalletId.vue';
import TxId from './commons/TxId.vue';
import BtcAddress from './commons/BtcAddress.vue';
import Exchange from './commons/Exchange.vue';

export default {
	components: {
		BtcAmount,
		WalletId,
		TxId,
		BtcAddress,
		Exchange
	},
	props: ['transaction','tx_id','no_border','about_wallet_ids'],
	data() {
		return {
			about_ids: this.about_wallet_ids || []
		}
	},
	created() {

	}
}
</script>

<style scoped>
.bordered{
border-bottom: 2px;
border-bottom-style: solid;

}


.custom-icon {
	height: 50px;
	padding: auto;
}

.centered {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
}

</style>
