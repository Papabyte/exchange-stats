<template>
	<b-modal id="setNickname" :title="$t('setNicknameModalTitle')" 
	:hide-footer="!!link"
	:okDisabled="!isValidNickname(nickname)"
	@close="link=false"
	@cancel="link=false" 
	@ok="handleOk">
		<b-container v-if="!link" fluid >
			<b-row>
				{{$t("setNicknameModalInstructions")}}
			</b-row>
			<b-row class="pt-3" >
				<b-form-input 
					:state="validNickname"
					:formatter="format" 
					v-model="nickname"
					id="input-nickname"
					></b-form-input>
			</b-row >
		</b-container>
		<b-container v-else fluid >
			<b-row class="pt-3">
				{{$t("setNicknameModalLinkHeader")}}
			</b-row >
		<b-row class="pt-3">
			<span class="text-break">
				<a :href="link">{{link}}</a>
			</span>
			</b-row >
			<b-row class="py-3">
				{{$t("setNicknameModalLinkFooter")}}
			</b-row >
		</b-container>
	</b-modal>
</template>

<script>
const conf = require("../../conf.js");
export default {	
	props: {
	},
	data(){
		return {
			nickname: "",
			link: null
		}
	},
	computed:{
		validNickname:function(){
			return this.isValidNickname(this.nickname);
		}
	},
	watch:{

	},
	methods:{
		isValidNickname(nickname){
			return nickname.length >= 3;
		},
		format(value, event) {
			return value = value.replace(' ','').replace('_','');
		},
		handleOk(bvModalEvt){
				bvModalEvt.preventDefault()	;
				const base64url = require('base64url');
				const data = {
					nickname: this.nickname
				};
				if (this.url_1)
					data.url_1 = this.url_1;
				if (this.url_2)
					data.url_2 = this.url_2;

				const json_string = JSON.stringify(data);
				const base64data = base64url(json_string);
				this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount=10000&base64data="+base64data;
		}
	}
}
</script>

<style lang='scss' scoped>
</style>