<template>
	<div>
		<span v-if="label"> {{label}}</span>{{amount/1000000000}} GB
	</div>
</template>

<script>

export default {
	props: ['amount', 'label']
}
</script>

<style lang='scss'>

</style>


