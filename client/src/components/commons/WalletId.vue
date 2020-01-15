<template>
	<span v-if="noUrl">
		{{id}}
	</span>
	<span v-else>
		<div v-if="label" class="title is-6 mb-05">{{label}}</div>
		<span class="wallet-link">
			<b-button
					size="is-medium"
					type="is-warning"
					icon-left="wallet"
					tag="router-link"
					:to="'/explorer/'+id"
					:target="target"
			>
				{{id}}
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
				type: Number,
				required: true,
			},
			noUrl: {
				type: Boolean,
				required: false,
				default: false,
			},
			newTab: {
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
			target: function () {

				return this.newTab ? '_blank' : ''
			},

		},
	}
</script>

<style lang='scss'>
	.wallet-link a {
		color: blue;
		font-weight: 600;
	}

	.folder-icon {
		height: 20px;
		padding: auto;
		margin-right: -2px;
		color: black;

	}
</style>
