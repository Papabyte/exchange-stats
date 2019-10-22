<template>
	<span v-if="noUrl">
		{{exchangeName}}
	</span>
	<span v-else>
		<span v-if="label"> {{label}} </span>
		<span class="exchange-link"><b-link :to="'/explorer/'+id" >
					<v-icon v-if="showIcon" name='trending-up' class="exchange-icon"/>
	{{exchangeName}}
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
		},
		showIcon: {
			type: Boolean,
			required: false,
			default: true
		}
	},
	computed:{

		exchangeName: function(){
			return this.$store.state.exchangesById[this.id] ? this.$store.state.exchangesById[this.id] : this.id;

		}
	}
}
</script>

<style lang='scss'>
.exchange-link a{
	color: darkorange;
	font-weight: 600;
}

.exchange-icon{
	height: 20px;
	padding: auto;
	margin-right: -3px;
	margin-bottom: 10px;
	color: black;

}

</style>
