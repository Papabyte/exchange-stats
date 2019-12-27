<template>
	<div class="main">
		<nav-bar />

		<section class="section">
			<div class="container">
				<h3 class="title is-3 mb-2">Faq</h3>
			</div>

			<div class="container">

				<b-collapse
						class="card"
						v-for="(collapse, index) of collapses"
						:key="index"
						:open="isOpen == index"
						@open="isOpen = index">
					<div
							slot="trigger"
							slot-scope="props"
							class="card-header"
							role="button">
						<p class="card-header-title">
							{{ collapse.title }}
						</p>
						<a class="card-header-icon">
							<b-icon size="is-small" :icon="props.open ? 'arrow-down' : 'arrow-up'"></b-icon>
						</a>
					</div>
					<div class="card-content">
						<div class="content" v-html="collapse.text"></div>
					</div>
				</b-collapse>
			</div>
		</section>
	</div>
</template>

<script>
	import NavBar from './commons/NavBar.vue'

	const conf = require('../conf.js')

	export default {
		components: {
			NavBar,
		},
		data () {
			return {
				conf: conf,
				isOpen: 0,
				collapses: [
					{
						title: this.$t('faqQuestion1'),
						text: this.$t('faqAnswer1'),
					}, {
						title: this.$t('faqQuestion2'),
						text: this.$t('faqAnswer2'),
					}, {
						title: this.$t('faqQuestion3'),
						text: this.$t('faqAnswer3'),
					}, {
						title: this.$t('faqQuestion4'),
						text: this.$t('faqAnswer4'),
					}, {
						title: this.$t('faqQuestion5'),
						text: this.$t('faqAnswer5'),
					}, {
						title: this.$t('faqQuestion6'),
						text: this.$t('faqAnswer6'),
					},
				],
			}
		},
		created () {
			document.title = this.$t('faqPageTitle', { website_name: conf.website_name })
			document.getElementsByName('description')[0].setAttribute('content', this.$t('faqMetaDescription'))
		},
	}
</script>

<style lang='scss' scoped>
	.question {

	}

	.answer {


	}

</style>
