<template>
	<div class="columns">
		<div class="column">
			<url-input v-for="(url,index) in urls" 
				:isRequired="index==0&&isAtLeastOneUrlRequired" 
				:index="index"
				@url_updated="updateUrl" 
				:key="index"/>
			</div>
		<div class="column is-1">
			<span @click="addUrlField"><v-icon v-if="urls.length < maxUrls" name='plus' class="plus-icon"/></span>
		</div>
	</div>
</template>

<script>

	import UrlInput from '../commons/UrlInput.vue'

	const isUrl = require('is-url')
	const maxUrls = 5

	export default {
		components: {
			UrlInput,
		},
		props: {
			isAtLeastOneUrlRequired: {
				type: Boolean,
				required: false,
				default: false,
			},
		},
		data () {
			return {
				urls: [null],
				maxUrls: maxUrls,
			}
		},
		watch: {},
		created () {

		},
		methods: {
			updateUrl (value, index, status) {
				this.urls[index] = value
				var bAreUrlsValid = true
				for (var i = 0; i < this.urls.length; i++) {
					if (this.urls[i] === false) // false when required url is wrong, null when url is wrong but not required
						bAreUrlsValid = false
				}
				this.$emit('urls_updated', this.urls, bAreUrlsValid)
			},
			addUrlField () {
				this.urls.push(null)
			},
		},
	}
</script>

<style lang='scss' scoped>
	.plus-icon {
		height: 30px;
	}

	.plus-icon:hover {
		cursor: pointer;
	}
</style>
