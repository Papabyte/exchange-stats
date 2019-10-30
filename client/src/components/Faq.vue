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
					<b-col offset-lg="1" lg="10" cols="12" class="main-col p-5">
						<b-media>
							<h5 class="mt-3 question"> {{$t('FaqQuestion1')}}</h5>
							<p class="answer">
							{{$t('FaqAnswer1')}}
							</p>
						</b-media>
						<b-media>
							<h5 class="mt-3 question"> {{$t('FaqQuestion2')}}</h5>
							<p class="answer">
							{{$t('FaqAnswer2')}}
							</p>
						</b-media>
						<b-media>
							<h5 class="mt-3 question"> {{$t('FaqQuestion3')}}</h5>
							<p class="answer">
							{{$t('FaqAnswer3')}}
							</p>
						</b-media>
						<b-media>
							<h5 class="mt-3 question"> {{$t('FaqQuestion4')}}</h5>
							<p class="answer">
							{{$t('FaqAnswer4')}}
							</p>
						</b-media>
						<b-media>
							<h5 class="mt-3 question"> {{$t('FaqQuestion5')}}</h5>
							<p class="answer">
							{{$t('FaqAnswer5')}}
							</p>
						</b-media>
						<b-media>
							<h5 class="mt-3 question"> {{$t('FaqQuestion6')}}</h5>
							<p class="answer">
							{{$t('FaqAnswer6')}}
							</p>
						</b-media>
					</b-col>
				</b-row >
			</b-container>
	</div>
</template>

<script>
import NavBar from './commons/NavBar.vue'

export default {
	components: {
		NavBar
	}
}
</script>

<style lang='scss' scoped>
.question{

}
.answer{


}
</style>
