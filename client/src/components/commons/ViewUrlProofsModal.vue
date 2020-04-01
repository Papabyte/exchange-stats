<template>
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{ $t('urlProofModalTitle') }}</p>
			<button class="delete" aria-label="close" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="container" v-if="proofsByOutcome.in && proofsByOutcome.in.length>0">
				<div class="row">
					{{$t('urlProofModalProofForAdding')}}
				</div>
				<div class="row" v-for="(url,index) in proofsByOutcome.in" :key="index">
					<a :href="url" target="_blank" rel="noopener noreferrer">{{url}}</a>
				</div>
			</div>
			<div class="container" v-if="proofsByOutcome.out && proofsByOutcome.out.length>0">
				<div class="row">
					{{$t('urlProofModalProofForRemoving')}}
				</div>
				<div class="row" v-for="(url,index) in proofsByOutcome.out" :key="index">
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
			operationItem: {
				type: Object,
				required: false,
				default: function () {
					return {}
				},
			},
		},
		data () {
			return {
				proofsByOutcome: {},
			}
		},
		created () {
			this.getLink()
		},
		watch: {
			operationItem: function () {
				this.proofsByOutcome = {}
				this.getLink()
			},
		},
		methods: {
			getLink () {
				this.proofsByOutcome = this.operationItem.url_proofs_by_outcome || {}
			},
		},
	}
</script>

<style lang='scss' scoped>
</style>
