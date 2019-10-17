<template>
	<div class="py-3">
		<b-form-input :placeholder="$t('urlInputsFirstHolder')" :formatter="format" v-model="url_1"></b-form-input>
		<span v-if="text_error_1" class="pt-3">{{text_error_1}}</span>
		<b-form-input :placeholder="$t('urlInputsSecondtHolder')"  :formatter="format" v-model="url_2" ></b-form-input>
		<span v-if="text_error_2" class="pt-3">{{text_error_2}}</span>
	</div>
</template>

<script>

const maxLength = 64;

export default {
	components: {
		
	},
	data(){
		return {
			url_1: "",
			url_2: "",
			text_error_1: null,
			text_error_2: null
		}
	},
	watch:{
		url_1: function(){
			if (this.url_1.length >= maxLength){
				this.text_error_1 = $t("urlInputsOversized", {max : maxLength});
			} else {
				this.text_error_1 = null;
			}
			this.$emit('url_1_update', this.url_1);
		},
		url_2: function(){
			if (this.url_2.length >= maxLength){
				this.text_error_2 = $t("urlInputsOversized", {max : maxLength});
			}else {
				this.text_error_2 = null;
			}
			this.$emit('url_2_update', this.url_2);
		}
	},
	methods: {
		format(value, event) {
			return value = value.slice(0, maxLength);
		}	
	}
}
</script>

<style lang='scss' scoped>
</style>
