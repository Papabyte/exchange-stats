<template>
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{ $t('setNicknameModalTitle') }}</p>
			<button class="delete" aria-label="close" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="container" v-if="!link">
				<div class="row">
					{{$t('setNicknameModalInstructions')}}
				</div>
				<b-field>
					<b-input
							v-model="nickname"
							id="input-nickname">
					</b-input>
				</b-field>
			</div>
			<div class="container" v-else>
				<div class="row">
					{{$t('setNicknameModalLinkHeader')}}
				</div>
				<div class="row">
					<wallet-link :link="link" />
				</div>
				<div class="row">
					{{$t('setNicknameModalLinkFooter')}}
				</div>
			</div>
		</section>
		<footer class="modal-card-foot f-end" v-show="!link">
			<button class="button" type="button" @click="$parent.close()">{{$t('commonButtonClose')}}</button>
			<button class="button is-primary" :disabled="!isValidNickname(nickname)" @click="handleOk">{{$t('commonButtonOk')}}</button>
		</footer>
	</div>
</template>

<script>
	const conf = require('../../conf.js')
	import WalletLink from './WalletLink.vue'

	export default {
		components: {
			WalletLink,
		},
		props: {},
		data () {
			return {
				nickname: '',
				link: null,
			}
		},
		computed: {
			validNickname: function () {
				return this.isValidNickname(this.nickname)
			},
		},
		watch: {},
		methods: {
			isValidNickname (nickname) {
				return nickname.length >= 3
			},
			format (value, event) {
				return value = value.replace(' ', '').replace('_', '')
			},
			handleOk (bvModalEvt) {
				bvModalEvt.preventDefault()
				const base64url = require('base64url')
				const data = {
					nickname: this.nickname,
				}
				if (this.url_1)
					data.url_1 = this.url_1
				if (this.url_2)
					data.url_2 = this.url_2

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
