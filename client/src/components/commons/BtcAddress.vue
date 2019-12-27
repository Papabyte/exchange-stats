<template>
	<div class="notification">
		<div v-if="label" class="title is-6 is-marginless">{{label}}</div>
		<div class="row">
			<span>{{address}}</span>
			<a target="_blank" :href="'https://blockstream.info/address/'+address" class="ml-05">
				<v-icon name='external-link' class="custom-icon"/>
			</a>
		</div>
	</div>
</template>

<script>

	export default {
		props: {
			label: {
				type: String,
				required: false,
			},
			address: {
				type: String,
				required: false,
			},
		},
	}
</script>

<style lang="scss" scoped>
	.row {
		display: flex;
		align-items: center;
	}

	.custom-icon {
		height: 20px;
	}

	.address {
		color: gray;
		font-weight: 600;
	}
</style>
