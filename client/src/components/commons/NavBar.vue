<!--<template>-->
<!--  <b-container fluid>-->
<!--    <b-navbar toggleable="lg" type="light" variant="light" class="row row-flex-cols">-->
<!--      <b-container>-->
<!--        <b-navbar-brand>{{conf.website_name}}</b-navbar-brand>-->
<!--        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>-->
<!--        <b-collapse id="nav-collapse" is-nav  class="justify-content-end">-->
<!--          <b-navbar-nav>-->
<!--            <b-nav-item to="/stats" :class="{active: selected_item=='0'}">{{$t("navbarRanking")}}</b-nav-item>-->
<!--            <b-nav-item to="/explorer" :class="{active: selected_item=='1'}">{{$t("navbarExplorer")}}</b-nav-item>-->
<!--            <b-nav-item to="/crowdsourcing" :class="{active: selected_item=='2'}">{{$t("navbarCrowdsourcing")}}</b-nav-item>-->
<!--            <b-nav-item to="/faq" :class="{active: selected_item=='3'}">{{$t("navbarFaq")}}</b-nav-item>-->
<!--          </b-navbar-nav>-->
<!--        </b-collapse>-->
<!--      </b-container>-->
<!--    </b-navbar>-->
<!--  </b-container>-->
<!--</template>-->
<template>
  <div class="navbar-wrapper">
    <div class="container">
      <b-navbar>
        <template slot="brand">
          <h4 class="title is-4 is-marginless"><b-navbar-item tag="router-link" :to="{ path: '/' }">{{conf.website_name}}</b-navbar-item></h4>
        </template>

        <template slot="end">
          <b-navbar-item tag="router-link" :to="{ path: '/stats' }" >{{$t("navbarRanking")}}</b-navbar-item>
          <b-navbar-item tag="router-link" :to="{ path: '/explorer' }">{{$t("navbarExplorer")}}</b-navbar-item>
          <b-navbar-item tag="router-link" :to="{ path: '/crowdsourcing' }">{{$t("navbarCrowdsourcing")}}</b-navbar-item>
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
  // props: {
	// 	selected_item: {
	// 		type: String,
	// 		default: '0'
	// 	}
	// },
	data(){
		return {
			conf: conf
		}
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

</style>
