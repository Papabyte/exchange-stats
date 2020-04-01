<template>
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{ $t('urlProofModalTitle') }}</p>
			<button class="delete" aria-label="close" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="container">
				<div class="row" v-for="(url,index) in proofsByOutcome.in" :key="index">
					<a :href="url" target="_blank" rel="noopener noreferrer">{{url}}</a>
				</div>
			</div>
		</section>
		<footer class="modal-card-foot f-end">
			<button class="button" type="button" @click="$parent.close()">{{$t('commonButtonClose')}}</button>
		</footer>
	</div>
</template>

<script>

	const conf = require('../../conf.js')

	export default {
		components: {},
		props: {
			propWalletId: {
				type: Number,
				required: true,
			},
			propExchange: {
				type: String,
				required: true,
			},
		},
		data () {
			return {
				proofsByOutcome: {},
			}
		},
		created () {
				this.axios.get('/api/url-proofs/'+this.propWalletId +'/'+this.propExchange).then((response, error) => {
					this.proofsByOutcome = response.data;
				});
		},

		methods: {

		},
	}
</script>

<style lang='scss' scoped>
</style>
