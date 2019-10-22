<template>
	<span v-if="noUrl">
		{{id}}
	</span>
	<span v-else>
		<span v-if="label"> {{label}} </span>
		<span class="wallet-link"><b-link :target="target" :to="'/explorer/'+id">
			<v-icon name='folder' class="folder-icon"/>
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
		},
		newTab:{
			type: Boolean,
			required: false,
			default: false
		}
	},
	computed:{
		target: function(){

			return this.newTab ? "_blank" : ""
		}

	}
}
</script>

<style lang='scss'>
.wallet-link a{
	color: blue;
	font-weight: 600;
}

.folder-icon{
	height: 20px;
	padding: auto;
	margin-right: -2px;
		color: black;

}
</style>
