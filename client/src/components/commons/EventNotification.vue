<template>
	<div></div>
</template>

<script>
	const conf = require('../../conf.js')

	export default {
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
				console.log('notify')
								console.log(event)

			const type = event.is_confirmed ? 'is-success' : 'is-warning'
			var message = event.is_confirmed ? 'Confirmed:' : 'Unconfirmed:'

			if (event.event_type = 'initial_stake' && event.proposed_outcome == 'in')
				message+= (event.nickname || event.concerned_address) + ' proposes to add wallet' + this.getWalletIdFromOperationId(event.operation_id) + ' to ' 
				+ this.getExchangeNameFromOperationId(event.operation_id);
			else if (event.event_type = 'initial_stake' && event.proposed_outcome == 'out')
				message+= (event.nickname || event.concerned_address) + ' proposes to remove wallet'  + this.getWalletIdFromOperationId(event.operation_id) +' from ' 
				+ this.getExchangeNameFromOperationId(event.operation_id);

			console.log(message)

			this.$buefy.notification.open({
					duration: 1000000,
					message: message,
					position: 'is-bottom-right',
					type: type,
					
			})

			},
			getExchangeNameFromOperationId(operation_id){
				return this.$store.state.exchangesById[operation_id.split('_')[1]].name
			},
			getWalletIdFromOperationId(operation_id){
				return Number(operation_id.split('_')[2])
			},
		},

	}
</script>

<style lang='scss' scoped>

</style>


