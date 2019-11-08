<template>
	<div>
		<nav-bar selected_item='3' />
			<b-container fluid>
				<b-row>
					<b-col cols="12" class="py-3">
						<h3 class="text-center">Faq</h3>
					</b-col>
				</b-row >
				<b-row>
					<b-col offset-lg="2" lg="8" cols="12" class="main-block p-5">
						<b-media>
							<h5 class="mt-3 question"> {{$t('faqQuestion1')}}</h5>
							<p class="answer" v-html="$t('faqAnswer1')"/>
						</b-media>
						<b-media>
							<h5 class="mt-3 question"> {{$t('faqQuestion2')}}</h5>
							<p class="answer">
							{{$t('faqAnswer2')}}
							</p>
						</b-media>
						<b-media>
							<h5 class="mt-3 question"> {{$t('faqQuestion3')}}</h5>
							<p class="answer">
							{{$t('faqAnswer3')}}
							</p>
						</b-media>
						<b-media>
							<h5 class="mt-3 question"> {{$t('faqQuestion4')}}</h5>
							<p class="answer" v-html="$t('faqAnswer4')"/>
						</b-media>
						<b-media>
							<h5 class="mt-3 question"> {{$t('faqQuestion5')}}</h5>
							<p class="answer">
							{{$t('faqAnswer5',{initial_stake: conf.challenge_min_stake_gb, period: conf.challenge_period_in_days,  coeff: conf.challenge_coeff})}}
							</p>
						</b-media>
						<b-media>
							<h5 class="mt-3 question"> {{$t('faqQuestion6')}}</h5>
							<p class="answer" v-html="$t('faqAnswer6')"/>
						</b-media>
					</b-col>
				</b-row >
			</b-container>
	</div>
</template>

<script>
import NavBar from './commons/NavBar.vue'
const conf = require("../conf.js");

export default {
	components: {
		NavBar
	},
	data() {
		return {
			conf: conf
		}
	},
	created(){
		document.title = this.$t("faqPageTitle", {website_name: conf.website_name});
		document.getElementsByName('description')[0].setAttribute('content',this.$t("faqMetaDescription"));
	}
}
</script>

<style lang='scss' scoped>
.question{

}
.answer{


}
</style>
