<template>
	<div class="py-3">
		<b-form-input 
			:placeholder="requireOneUrl ? $t('urlInputsFirstHolder') : $t('urlInputsFirstHolderOptional')" 
			:state="isInput1Valid" 
			:formatter="format" 
			v-model="url_1">
		</b-form-input>
		<span v-if="text_error_1" class="pt-3">{{text_error_1}}</span>
		<b-form-input 
		:placeholder="$t('urlInputsSecondHolder')"
		:state="isInput2Valid" 
		:formatter="format" 
		v-model="url_2" ></b-form-input>
		<span v-if="text_error_2" class="pt-3">{{text_error_2}}</span>
	</div>
</template>

<script>

const maxLength = 64;
const isUrl = require('is-url');

export default {
	components: {
		
	},
	props: {
		requireOneUrl: {
			type: Boolean,
			required: false,
			default:  false
		}
	},
	data(){
		return {
			url_1: "",
			url_2: "",
			text_error_1: null,
			text_error_2: null,
			isInput1Valid: null,
			isInput2Valid: null
		}
	},
		watch:{
		url_1: function(){
			if (this.url_1.length >= maxLength){
				this.text_error_1 = $t("urlInputsOversized", {max : maxLength});
			} else {
				this.text_error_1 = null;
			}
			this.isInput1Valid = this.requireOneUrl ? isUrl(this.url_1) : (this.url_1 ? isUrl(this.url_1) : (isUrl(this.url_1) || null));
			this.$emit('url_1_update', this.url_1);
		},
		url_2: function(){
			if (this.url_2.length >= maxLength){
				this.text_error_2 = $t("urlInputsOversized", {max : maxLength});
			} else {
				this.text_error_2 = null;
			}
			this.isInput2Valid = this.url_2 ? isUrl(this.url_2) : (isUrl(this.url_2) || null);
			this.$emit('url_2_update', this.url_2);
		},
		requireOneUrl: function(){

		}
	},
	created(){
		this.isInput1Valid = this.requireOneUrl ? false : null;
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
