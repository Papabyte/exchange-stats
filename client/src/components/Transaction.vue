<template>
<b-container fluid>
	<b-row>
		<b-col offset-lg="2" lg="4" cols="6" class="py-3">
			{{tx_id}}
		</b-col>
	</b-row>
	<b-row >
		<b-col offset-lg="2" lg="4" cols="6" class="py-3">
			<b-link :to="'/explorer/'+transaction.from.id">
				{{transaction.from.id}}
			</b-link>
				{{transaction.from.amount}}
			</b-col>
			<b-col lg="4" cols="6" class="py-3">
				<div  v-for="t_out in transaction.to" v-bind:key="t_out">
					{{t_out.id ? t_out.id : t_out.address }}
					{{t_out.amount}}
				</div>
				{{transaction.to.address}}
				{{transaction.to.amount}}
			</b-col>
	</b-row >
</b-container >
</template>

<script>

export default {
	props: ['tx_id','transaction'],
	data() {
		return {
		}
	},
	created() {
		console.log(JSON.stringify(this.transaction));
	}
}
</script>

<style >

</style>
