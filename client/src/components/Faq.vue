<template>
	<div class="main">
		<nav-bar />

		<section class="section">
			<div class="container">
				<h3 class="title is-3 mb-2">FAQ</h3>
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
				collapses:[]
			}
		},
		created () {
			document.title = this.$t('faqPageTitle', { website_name: conf.website_name })
			document.getElementsByName('description')[0].setAttribute('content', this.$t('faqMetaDescription'))
			this.loadFaq()
		},
		methods:{

			loadFaq: function(){
				this.collapses= []
				for (var i=0; i < this.$t('faq').length; i++)
					this.collapses.push({
						title: this.$t('faq['+i+'].title'),
						text: this.$t('faq['+i+'].text', {
							github: conf.github,
							coeff: conf.challenge_coeff,
							min_stake: this.$store.state.aaParameters.min_reward/conf.gb_to_bytes
						}),
					})
				if (!this.$store.state.aaParameters.min_reward)
					setTimeout(this.loadFaq, 100)
			}
		}
	}
</script>

<style lang='scss' scoped>
	.question {

	}

	.answer {


	}

</style>
