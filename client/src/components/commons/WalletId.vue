<template>
	<span v-if="noUrl">
		{{id}}
	</span>
	<span v-else>
		<span v-if="label"> {{label}} </span>
		<span class="wallet-link"><b-link :to="'/explorer/'+id">
			{{id}}
	</b-link></span>
	</span>
</template>

<script>

export default {
	props: {
		label: {
			type: String,
			required: false,
			default: null
		},
		id: {
			type: Number,
			required: true
		},
		noUrl: {
			type: Boolean,
			required: false,
			default: false
		}
	}
}
</script>

<style lang='scss'>
.wallet-link a{
	color: blue;
	font-weight: 600;
}
</style>
