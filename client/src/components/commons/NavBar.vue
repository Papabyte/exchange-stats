<template>
  <b-container fluid>
    <b-navbar type="light" variant="light" class="row">
      <b-col offset-lg="1" lg="10" cols="12">
        <div class="row">
          <b-navbar-brand>{{conf.website_name}}</b-navbar-brand>
          <b-navbar-nav class="ml-auto">
            <b-nav-item to="/stats" :class="{active: selected_item=='0'}">{{$t("navbarRanking")}}</b-nav-item>
            <b-nav-item to="/explorer" :class="{active: selected_item=='1'}">{{$t("navbarExplorer")}}</b-nav-item>
            <b-nav-item to="/crowdsourcing" :class="{active: selected_item=='2'}">{{$t("navbarCrowdsourcing")}}</b-nav-item>
            <b-nav-item to="/faq" :class="{active: selected_item=='3'}">{{$t("navbarFaq")}}</b-nav-item>
          </b-navbar-nav>
        </div>
      </b-col>
    </b-navbar>
  </b-container>

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
	data(){
		return {
			conf: conf
		}
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

  .navbar {
    box-shadow: 0 1px 10px rgba(151,164,175,.1)
  }

</style>
