<template>
	


  <b-modal id="addWallet" title="Add wallet to exchange">
    <p class="my-4">You are going to add a wallet to exchange {{exchange_name ? exchange_name : exchange}}</p>
  </b-modal>


</template>

<script>

export default {	
	components: {
		
	},
	props: ['exchange', 'exchange_name']
}
</script>

<style lang='scss' scoped>
	.custom-icon {
			height: 20px;
	}

.address {
	color: purple;
}
</style>