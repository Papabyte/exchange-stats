<template>
	<span><span v-if="label"> {{label}}</span>{{(amount/1000000000).toPrecision(6)}} GB</span>
</template>

<script>

export default {
	props: ['amount', 'label']
}
</script>

<style lang='scss'>

</style>


