import {methods as utils} from './utils.js'

export default {
	methods: {
		getEventMessage: function(event){
			var message = ''
			if (event.event_type == 'initial_stake' && event.event_data.proposed_outcome == 'in')
				message+= this.$t('eventMessageProposesAddingWallet', {
					contributor:event.nickname || event.concerned_address,
					wallet: this.getWalletIdFromOperationId(event.operation_id), 
					exchange:this.getExchangeNameFromOperationId(event.operation_id)
				})
			else if (event.event_type == 'initial_stake' && event.event_data.proposed_outcome == 'out')
			message+= this.$t('eventMessageProposesRemovingWallet', {
				contributor:event.nickname || event.concerned_address,
				wallet: this.getWalletIdFromOperationId(event.operation_id), 
				exchange:this.getExchangeNameFromOperationId(event.operation_id)
			})
			else if (event.event_type == 'stake' && event.event_data.proposed_outcome == 'out' && event.operation.initial_outcome == 'in')
				message+= this.$t('eventMessageContestAddingWallet', {
					contributor:event.nickname || event.concerned_address,
					wallet: this.getWalletIdFromOperationId(event.operation_id), 
					exchange:this.getExchangeNameFromOperationId(event.operation_id)
				})
			else if (event.event_type == 'stake' && event.event_data.proposed_outcome == 'in' && event.operation.initial_outcome == 'out')
				message+= this.$t('eventMessageContestRemovingWallet', {
					contributor:event.nickname || event.concerned_address,
					wallet: this.getWalletIdFromOperationId(event.operation_id), 
					exchange:this.getExchangeNameFromOperationId(event.operation_id)
				}) 
			else if (event.event_type == 'stake' && event.event_data.proposed_outcome == 'in' && event.operation.initial_outcome == 'in')
				message+= this.$t('eventMessageConfirmAddingWallet', {
					contributor:event.nickname || event.concerned_address,
					wallet: this.getWalletIdFromOperationId(event.operation_id), 
					exchange:this.getExchangeNameFromOperationId(event.operation_id)
				})
			else if (event.event_type == 'stake' && event.event_data.proposed_outcome == 'out' && event.operation.initial_outcome == 'out')
				message+= this.$t('eventMessageConfirmRemovingWallet', {
					contributor:event.nickname || event.concerned_address,
					wallet: this.getWalletIdFromOperationId(event.operation_id), 
					exchange:this.getExchangeNameFromOperationId(event.operation_id)
				})
			else if (event.event_type == 'commit' && event.operation.outcome == 'in')
				message+= this.$t('eventMessageCommitAddingWallet', {
					contributor:event.nickname || event.concerned_address,
					wallet: this.getWalletIdFromOperationId(event.operation_id), 
					exchange:this.getExchangeNameFromOperationId(event.operation_id)
				})
			else if (event.event_type == 'commit' && event.operation.outcome == 'out')
				message+= this.$t('eventMessageCommitRemovingWallet', {
					contributor:event.nickname || event.concerned_address,
					wallet: this.getWalletIdFromOperationId(event.operation_id), 
					exchange:this.getExchangeNameFromOperationId(event.operation_id)
				})
			else if (event.event_type == 'withdraw' && event.operation.outcome == 'out')
				message+= this.$t('eventMessageCommitRemovingWallet', {
					contributor: event.nickname || event.concerned_address,
					amount: utils.getByteAmountString(event.paid_out), 
				})
			return message;
		},
		getExchangeNameFromOperationId(operation_id){
			return this.$store.state.exchangesById[operation_id.split('_')[1]].name
		},
		getWalletIdFromOperationId(operation_id){
			return Number(operation_id.split('_')[2])
		},
  }
};