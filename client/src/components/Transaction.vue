<template>
<b-container fluid :class="{even:even, odds:!even}">
	<div class="py-4">
	<b-row>
		<b-col  cols="8" >
			<TxId label="Transaction: " :tx_id="tx_id"/>
		</b-col>
			<b-col  cols="2 text-center" >
			Time: {{transaction.time}}
		</b-col>
				<b-col  cols="2 text-center" >
			Block: {{transaction.height}}
		</b-col>
	</b-row>
	<b-row class="justify-content-between">
		<b-col  cols="5" class="py-3">
			<WalletId v-if="transaction.from && transaction.from.id" label="Wallet: " :id="transaction.from.id"/>
			<BtcAmount v-if="transaction.from && transaction.from.amount" label="Amount: " :amount="transaction.from.amount"/>
		</b-col>
		<b-col class="text-center">
			<div class="centered">
				<v-icon name='arrow-right' class="custom-icon"/>
			</div>
		</b-col>
			<b-col  cols="5" class="py-3">
				<div  v-for="(t_out,index) in transaction.to" :key="index" class="py-2">
					<WalletId v-if="t_out.id" label="Wallet: " :id="t_out.id"/>
					<span v-else>Wallet: unknown yet</span>

					<BtcAddress v-if="t_out.address" label="Address: " :address="t_out.address"/>
					<BtcAmount label="Amount: " :amount="t_out.amount"/>
				</div>
			</b-col>
	</b-row >
	</div>
</b-container >
</template>

<script>
//commons
import BtcAmount from './commons/BtcAmount.vue';
import WalletId from './commons/WalletId.vue';
import TxId from './commons/TxId.vue';
import BtcAddress from './commons/BtcAddress.vue';

export default {
	components: {
		BtcAmount,
		WalletId,
		TxId,
		BtcAddress
	},
	props: ['tx_id','transaction', 'even'],
	data() {
		return {
		}
	},
	created() {
		console.log(JSON.stringify(this.transaction));
	}
}
</script>

<style scoped>
.even{
background-color:#eeeeee;

}
.odds{
background-color:#e5e5e5;

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
