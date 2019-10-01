<template>
	<div v-if="isSelf">
		{{id}}

	</div>
	<div v-else>
		<span v-if="label"> {{label}} </span>
			<b-link :to="'/explorer/'+id">
	{{id}}
	</b-link>
	</div>
</template>

<script>

export default {
	props: ['label','id', 'isSelf']
}
</script>

<style lang='scss'>

</style>
