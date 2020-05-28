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
				<wallet-link :link="link" />
			</div>
			<div class="container">
				{{$t('commitModalLinkFooter')}}
			</div>
		</section>
		<footer class="modal-card-foot f-end">
			<button class="button" type="button" @click="$parent.close()">{{$t('commonButtonClose')}}</button>
		</footer>
	</div>
</template>

<script>
	const conf = require('../../conf.js')
	import WalletLink from './WalletLink.vue'

	export default {
		components:{
			WalletLink
		},
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
				const data = {
					exchange: this.operationItem.exchange,
					commit: 1,
				}
				if (this.operationItem.initial_outcome == 'in')
					data.add_wallet_id = this.operationItem.wallet_id
				else
					data.remove_wallet_id = this.operationItem.wallet_id
				const json_string = JSON.stringify(data)
				const base64data = encodeURIComponent(btoa(json_string))
				this.link = conf.protocol + ':' + conf.aa_address + '?amount=10000&base64data=' +
					base64data
			},
		},
	}
</script>

<style lang='scss' scoped>
</style>
