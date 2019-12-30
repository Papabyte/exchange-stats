<template>
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{ this.getTitle }}</p>
			<button class="delete" aria-label="close" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="container">
				{{$t('commitModalLinkHeader')}}
			</div>
			<div class="container">
				<a :href="link">{{link}}</a>
			</div>
			<div class="container">
				{{$t('commitModalLinkFooter')}}
			</div>
		</section>
		<footer class="modal-card-foot f-end">
			<button class="button" type="button" @click="$parent.close()">Close</button>
		</footer>
	</div>
</template>

<script>
	const conf = require('../../conf.js')
	export default {
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
				link: false
			}
		},
		computed: {
			getTitle: function () {
				return this.$t('commitModalTitle')
			},
		},
		watch: {

		},
		created () {
			this.createLink()
		},
		methods: {
			createLink (address) {
				const base64url = require('base64url')
				const data = {
					exchange: this.operationItem.exchange,
					commit: 1,
				}
				if (this.operationItem.initial_outcome == 'in')
					data.add_wallet_id = this.operationItem.wallet_id
				else
					data.remove_wallet_id = this.operationItem.wallet_id
				const json_string = JSON.stringify(data)
				const base64data = base64url(json_string)
				this.link = (conf.testnet ? 'byteball-tn' : 'byteball') + ':' + conf.aa_address + '?amount=10000&base64data=' +
					base64data
			},
		},
	}
</script>

<style lang='scss' scoped>
</style>
