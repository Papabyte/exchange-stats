<template>
	<div class="row">
		<b-input
				:placeholder="index == 0 ? (isRequired ? $t('urlInputsFirstHolder') : $t('urlInputsFirstHolderOptional')) : $t('urlInputsNextHolder')"
				:state="isUrlValid"
				:formatter="format"
				v-model="url"
		/>
		<span v-if="text_error" class="pt-3">{{text_error}}</span>
	</div>
</template>

<script>

	const maxLength = 64
	const isUrl = require('is-url')

	export default {
		components: {},
		props: {
			isRequired: {
				type: Boolean,
				required: false,
				default: false,
			},
			index: {
				type: Number,
				required: true,
			},
		},
		data () {
			return {
				url: '',
				text_error: null,
				isUrlValid: null,
			}
		},
		watch: {
			url: function () {
				if (this.url.length >= maxLength) {
					this.text_error = this.$t('urlInputsOversized', { max: maxLength })
				} else {
					this.text_error = null
				}
				this.isUrlValid = this.isRequired ? isUrl(this.url) : (this.url ? isUrl(this.url) : (isUrl(this.url) || null))
				this.$emit('url_updated', this.isUrlValid ? this.url : this.isUrlValid, this.index)
			},
			required: function () {

			},
		},
		created () {
			this.isUrlValid = this.isRequired ? false : null
			this.$emit('url_updated', null, this.index)
		},
		methods: {
			format (value, event) {
				return value = value.slice(0, maxLength)
			},
		},
	}
</script>

<style lang='scss' scoped>
</style>
