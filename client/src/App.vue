<template>
	<div>
		<div id="app" class="app">
			<router-view />
		</div>
			<eventNotification />
	</div>
</template>

<script>
import EventNotification from './components/commons/EventNotification.vue'

export default {
	components:{
		EventNotification
	},
	name: 'app',
	created(){
		this.$store.dispatch('getExchanges');
		this.$store.dispatch('getAaParameters');
	}
}
</script>

