<template>
	<span v-if="noUrl">
		{{exchangeName}}
	</span>
	<span v-else>
		<div v-if="label" class="title is-6 mb-05">
			{{label}}
		</div>
		<span class="wallet-link">
			<b-button
					size="is-medium"
					type="is-warning"
					tag="router-link"
					:to="'/explorer/'+id"
			>
				<v-icon v-if="showIcon" name='trending-up' class="exchange-icon"/>
				{{exchangeName}}
			</b-button>
		</span>
	</span>
</template>

<script>

	export default {
		props: {
			label: {
				type: String,
				required: false,
				default: null,
			},
			id: {
				type: String,
				required: true,
			},
			noUrl: {
				type: Boolean,
				required: false,
				default: false,
			},
			showIcon: {
				type: Boolean,
				required: false,
				default: true,
			},
		},
		computed: {

			exchangeName: function () {
				return this.$store.state.exchangesById[this.id] ? this.$store.state.exchangesById[this.id].name : this.id

			},
		},
	}
</script>

<style lang='scss'>
	.exchange-link a {
		color: darkorange;
		font-weight: 600;
	}

	.wallet-link {
		a > span {
			display: flex;
			align-items: center;
		}
	}

	.exchange-icon {
		height: 20px !important;
		margin-right: 5px !important;
	}

</style>
