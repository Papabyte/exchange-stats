<template>
	<span v-if="noUrl">
		{{id}}
	</span>
	<span v-else>
		<span v-if="label"> {{label}} </span>
		<span class="exchange-link"><b-link :to="'/explorer/'+id" >
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
			type: String,
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
.exchange-link a{
	color: darkorange;
	font-weight: 600;
}

</style>
