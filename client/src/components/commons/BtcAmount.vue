<template>
	<div>
		<span v-if="label"> {{label}}</span>{{amount/100000000}} BTC
	</div>
</template>

<script>

export default {
	props: ['amount', 'label']
}
</script>

<style lang='scss'>

</style>
