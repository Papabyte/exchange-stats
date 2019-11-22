<template>
	<div class="navbar-wrapper">
		<div class="container">
			<b-navbar>
				<template slot="brand">
					<h4 class="title is-4 is-marginless">
						<b-navbar-item tag="router-link" :to="{ path: '/' }">{{conf.website_name}}</b-navbar-item>
					</h4>
				</template>

				<template slot="end">
					<b-navbar-item tag="router-link" :to="{ path: '/' }">{{$t("navbarRanking")}}</b-navbar-item>
					<b-navbar-item tag="router-link" :to="{ path: '/explorer' }">{{$t("navbarExplorer")}}</b-navbar-item>
					<b-navbar-item tag="router-link" :to="{ path: '/crowdsourcing' }">{{$t("navbarCrowdsourcing")}}
					</b-navbar-item>
					<b-navbar-item tag="router-link" :to="{ path: '/faq' }">{{$t("navbarFaq")}}</b-navbar-item>
				</template>
			</b-navbar>
		</div>
	</div>

</template>

<script>
	const conf = require("../../conf.js");

	export default {
		name: 'NavBar',
		props: {
			selected_item: {
				type: String,
				default: '0'
			}
		},
		data() {
			return {
				conf: conf
			}
		}
	}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

	.navbar {
		box-shadow: 0 1px 10px rgba(151, 164, 175, .1)
	}

	.router-link-active {
		font-weight: 600;
	}

</style>
