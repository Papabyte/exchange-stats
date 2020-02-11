<template>
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{ this.getTitle }}</p>
			<button class="delete" aria-label="close" @click="$parent.close()"></button>
		</header>	
		<section class="modal-card-body">

		<div class="container" v-if="!link">
			<div class="row">
				{{$t('claimModalSelectAddress')}}
			</div>
			<div class="row">
				<div v-for="(address,index) in operationItem.claimAddresses" :key="index">
					<b-button  @click="claim(address)" 	class="button is-info is-outlined mt-1">{{address}}
					</b-button>
				</div>
			</div>
		</div>
		<div class="container" v-else >
			<div class="row" >
				{{$t('claimModalLinkHeader')}}
			</div>
			<div class="row">
				<wallet-link :link="link" />
			</div>
			<div class="row" >
				{{$t('claimModalLinkFooter')}}
			</div>
		</div>
		</section>

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
				text_error: null,
				items: [],
				link: false,
			}
		},
		computed: {
			getTitle: function () {
				return 'Claim a gain'
			},
		},
		methods: {
			claim (address) {
				const base64url = require('base64url')
				const data = {
					withdraw: 1,
					operation_id: this.operationItem.operation_id,
					address: address,
				}

				const json_string = JSON.stringify(data)
				const base64data = base64url(json_string)
				this.link = conf.protocol + ':' + conf.aa_address + '?amount=10000&base64data=' +
					base64data
			},
		},
	}
</script>

<style lang='scss' scoped>
</style>
