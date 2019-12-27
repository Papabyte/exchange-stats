<template>
	<div>
		<trend
				:data="data"
				:gradient="['#6fa8dc', '#42b983', '#2c3e50']"
				:width="200"
				:height="50"
				auto-draw
				smooth
		>
		</trend>
	</div>
</template>

<script>
	import Trend from 'vuetrend'

	export default {
		components: {
			Trend,
		},
		props: {
			data: {
				type: Array,
				required: false,
				default: null,
			},
			id: {
				type: String,
				required: false,
				default: null,
			},
		},
		computed: {
			exchangeName: function () {
				return this.$store.state.exchangesById[this.id] ? this.$store.state.exchangesById[this.id] : this.id
			},
		},
		created () {
			console.log(this.data)
		},
	}
</script>

<style lang='scss'>
</style>
