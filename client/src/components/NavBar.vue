<template>
 <div>
  <b-navbar type="dark" variant="info">
		<b-navbar-nav>
    <b-nav-item to="stats" :class="{active: selected_item==0}">Exchanges Stats</b-nav-item>
    <b-nav-item to="about" :class="{active: selected_item==1}">About</b-nav-item>
		</b-navbar-nav>
  </b-navbar>
</div>
</template>

<script>
export default {
  name: 'NavBar',
  props: {
		selected_item: {
			type: Number,
			default: 0
		}
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
