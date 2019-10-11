<template>
	<div>
		<div class="d-inline">
		<span  v-if="label">{{label}}</span><span class="tx_id text-break">{{tx_id}}</span>
		</div>
			<div class="d-inline">
				<b-link target="_blank" :href="'https://blockstream.info/tx/'+tx_id">
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
			required: false,
			default: null
		},
		tx_id: {
			type: String,
			required: true
		}
	}
}
</script>

<style lang='scss' scoped>
	.custom-icon {
			height: 20px;
	}

.tx_id {
	color: gray;
	font-weight: 600;
}
</style>
