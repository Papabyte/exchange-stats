<template>
 <div>
  <b-navbar type="dark" variant="info">
		<b-navbar-nav>
		<b-nav-item to="/stats" :class="{active: selected_item=='0'}">Exchanges Stats</b-nav-item>
		<b-nav-item to="/explorer" :class="{active: selected_item=='1'}">Wallet explorer</b-nav-item>
		<b-nav-item to="/crowdsourcing" :class="{active: selected_item=='2'}">Crowdsourcing</b-nav-item>
		<b-nav-item to="/about" :class="{active: selected_item=='3'}">About</b-nav-item>

		</b-navbar-nav>
  </b-navbar>
</div>
</template>

<script>
export default {
  name: 'NavBar',
  props: {
		selected_item: {
			type: String,
			default: '0'
		}
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
