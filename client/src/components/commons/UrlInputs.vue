<template>
	<div class="py-3">
		<url-input v-for="(url,index) in urls" :isRequired="index==0&&isAtLeastOneUrlRequired" :index="index" @url_updated="updateUrl" :key="index" />
		<span @click="addUrlField"><v-icon v-if="urls.length < maxUrls" name='plus' class="plus-icon" /></span>
	</div>
</template>

<script>

import UrlInput from '../commons/UrlInput.vue';

const isUrl = require('is-url');
const maxUrls = 5;

export default {
	components: {
		UrlInput
	},
	props: {
		isAtLeastOneUrlRequired:{
			type: Boolean,
			required: false,
			default:  false
		}
	},
	data(){
		return {
			urls: [null],
			maxUrls: maxUrls
		}
	},
	watch:{

	},
	created(){

	},
	methods: {
		updateUrl(value, index, status) {
			this.urls[index] = value;
			var bAreUrlsValid = true;
			for (var i = 0; i < this.urls.length; i++){
				if (this.urls[i] === false) // false when required url is wrong, null when url is wrong but not required
					bAreUrlsValid = false;
			}
			this.$emit('urls_updated', this.urls, bAreUrlsValid);
		},
		addUrlField(){
			this.urls.push(null);
		}
	}
}
</script>

<style lang='scss' scoped>
	.plus-icon {
		height: 40px;
	}

.plus-icon:hover {
    cursor: pointer;
}
</style>
