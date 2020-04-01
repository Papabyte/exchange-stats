<template>
	<div class="notification full-height">
		<span v-if="label" class="title is-6">{{label}}</span>
		<span class="title is-5 is-marginless">{{tx_id}}</span>
		<a target="_blank" rel="noopener noreferrer" :href="'https://blockstream.info/tx/'+tx_id" class="ml-1 a">
			<v-icon name='external-link' class="link-icon"/>
		</a>
	</div>
</template>

<script>

	export default {
		props: {
			label: {
				type: String,
				required: false,
				default: null,
			},
			tx_id: {
				type: String,
				required: true,
			},
		},
	}
</script>

<style lang='scss' scoped>


	.a {
		display: inline-block;
		  vertical-align: top;

	}

	.link-icon {
		height: 20px;
		margin-top: -0.25rem;

	}

	.tx_id {
		color: gray;
		font-weight: 600;
	}
</style>
