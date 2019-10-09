<template>
	<div class="py-3">
		<b-form-input :formatter="format" v-model="url_1" placeholder="Enter first proof url (optional)"></b-form-input>
		<span v-if="text_error_1" class="pt-3">{{text_error_1}}</span>
		<b-form-input :formatter="format" v-model="url_2" placeholder="Enter second proof url (optional)"></b-form-input>
		<span v-if="text_error_2" class="pt-3">{{text_error_2}}</span>
	</div>
</template>

<script>
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
			console.log("changed");
			if (this.url_1.length >= 64){
				this.text_error_1 = "Cannot be more than 64 characters, you should use an url shortener service."
			} else {
				this.text_error_1 =null;
			}
			this.$emit('url_1_update', this.url_1);
		},
		url_2: function(){
			if (this.url_2.length >= 64){
				this.text_error_2 = "Cannot be more than 64 characters, you should use an url shortener service."
			}else {
				this.text_error_2 =null;
			}
			this.$emit('url_2_update', this.url_2);
		}
	},
	methods: {
		format(value, event) {
			return value = value.slice(0,64);
		}	
	}
}
</script>

<style lang='scss' scoped>
</style>
