<template>
	<div>
		<div class="d-inline">
			<span v-if="label">{{label}}</span><span class="address text-break">{{address}}</span>
		</div>
		<div class="d-inline">
				<b-link target="_blank" :href="'https://blockstream.info/address/'+address">
				<v-icon name='external-link' class="custom-icon"/>
			</b-link>
		</div>
	</div>
</template>

<script>

export default {
	props: {
		label: {
			type: String,
			required: false
		},
		address: {
			type: String,
			required: false
		}
	}
}
</script>

<style scoped>
.custom-icon {
	height: 20px;
}

.address {
	color: gray;
	font-weight: 600;
}
</style>
