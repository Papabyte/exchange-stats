<template>
	<div id="app" class="app">
		<router-view />
	</div>
</template>

<script>
export default {
	name: 'app',
	created(){
		this.$store.dispatch('getExchanges');
	}
}
</script>

