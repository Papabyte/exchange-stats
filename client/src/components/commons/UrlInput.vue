<template>
	<div class="row">
		<b-field
			:type="type">
			<b-input
					:placeholder="index == 0 ? (isRequired ? $t('urlInputsFirstHolder') : $t('urlInputsFirstHolderOptional')) : $t('urlInputsNextHolder')"
					:formatter="format"
					v-model="url"
			/>
		</b-field>
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
				isUrlValid: null
			}
		},
		
		computed:{
			type:function(){
				if (this.isUrlValid == null) 
					return ''
				else if (this.isUrlValid)
					return 'is-success'
				else
					return 'is-danger'
			}
		},
		watch: {
			url: function () {
				const domain = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/.exec(this.url);
				if (this.url.length >= maxLength) {
					this.text_error = this.$t('urlInputsOversized', { max: maxLength })
				} else if (domain && this.$store.state.arrBlacklistedDomains.indexOf(domain[1]) > -1){
					this.text_error =  this.$t('urlInputsBlacklistedDomain')
				} else {
					this.text_error = null
					this.isUrlValid = this.isRequired ? isUrl(this.url) : (this.url ? isUrl(this.url) : (isUrl(this.url) || null))
					this.$emit('url_updated', this.isUrlValid ? this.url : this.isUrlValid, this.index)
				}
			}
		},
		created () {
			this.isUrlValid = this.isRequired ? false : null
			this.$emit('url_updated', this.isUrlValid, this.index)
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
