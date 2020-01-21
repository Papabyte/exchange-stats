<template>
	<div></div>
</template>

<script>
	const conf = require('../../conf.js')
	import getEventMessage from '../../mixins/eventMessage'

	export default {
		mixins:[getEventMessage],
		props: {
	
		},
		data () {
			return {
				timerId : null
			}
		},
		computed: {

		},
		created() {
			this.timerId = setInterval(this.update, 10000)
			this.update()
		},
		beforeDestroy () {
			clearInterval(this.timerId)
		},
		methods:{
			concatTriggerAndConfirmationStatus: function(event){
				return event.trigger_unit + (event.is_confirmed ? '1' : '0')
			},
			update: function(){
				this.axios.get('/api/last-events').then((response) => {
					if (this.$store.state.arrKnownEvents.length === 0)
						return this.$store.commit('setKnownEvents',response.data.map(event => this.concatTriggerAndConfirmationStatus(event)))
					else {
						response.data.forEach((event)=>{
						if (this.$store.state.arrKnownEvents.indexOf(this.concatTriggerAndConfirmationStatus(event)) === -1)
							this.notify(event)
						})
						return this.$store.commit('setKnownEvents',response.data.map(event => this.concatTriggerAndConfirmationStatus(event)))
					}
				})
			},
			notify: function(event){
				const type = event.is_confirmed ? 'is-success' : 'is-warning'
				var message = event.is_confirmed ? this.$t('eventNotificationConfirmed') : this.$t('eventNotificationUnconfirmed')
				message+= this.getEventMessage(event)

				this.$buefy.notification.open({
					duration: 60000,
					message: message,
					position: 'is-bottom-right',
					type: type,
					queue: true
				})
			},
		},

	}
</script>

<style lang='scss' scoped>

</style>


