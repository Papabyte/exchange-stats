const conf = require('../conf.js')


export default {
	components: {

	},
	props: {
		propWalletId: {
			type: Number,
			required: false,
			default: null,
		},
		propExchange: {
			type: String,
			required: false,
			default: null,
		}
	},
	data () {
		return {
			notification_text: '',
			notification_type: '',
			selectedWalletId: null,
			targetedWalletId: null,
			selectedExchange: null,
			isSpinnerActive: false,
			isOperationPossible: false,
			isRedirected: false,
			rewardAmount: false,
			wallet_digest: null,
			stakeAmount: conf.challenge_min_stake_gb * conf.gb_to_bytes,
			link: false,
			urls: [],
			bAreUrlsValid: false,
		}
	},
	methods: {
		urls_updated (urls, bAreUrlsValid) {
			this.urls = urls
			this.bAreUrlsValid = bAreUrlsValid
		},
		isWalletId (wallet) {
			return (Number(wallet) && parseInt(wallet))
		},
		checkIfOperationIsPossible () {
			this.notification_text = null
			this.bestPoolId = false
			this.rewardAmount = 0
			this.isSpinnerActive = true
			this.isOperationPossible = false
			this.bestPoolId = false
			this.isRedirected = false
			this.wallet_digest = null
			if (!this.isRemoving){
				this.axios.get('/api/redirection/' + this.selectedWalletId).then((response, error) => {
					this.targetedWalletId = response.data.redirected_id
					this.checkWallet()
				})
			} else {
				this.targetedWalletId =this.selectedWalletId
				this.checkWallet()
			}
		},
		checkWallet(){
			if (this.selectedWalletId != this.targetedWalletId)
					this.isRedirected = true;

				this.axios.get('/api/wallet/' + this.targetedWalletId+ '/0').then((response) => {

					if (!response.data.txs){
						this.notification_text = this.$t('editModalWalletNotFound')
						this.notification_type = 'is-danger'
						this.targetedWalletId = null
						return this.isSpinnerActive = false
					}
					if (response.data.isOnOperation && !this.isRemoving) {
						this.notification_text = this.$t('editModalOperationOnGoing',
							{ wallet: this.targetedWalletId })
						this.notification_type = 'is-danger'
						return this.isSpinnerActive = false
					}
					if (response.data.exchange == this.selectedExchange && !this.isRemoving){
						this.notification_text = this.$t('editModalAlreadyBelongs',
								{ wallet: this.targetedWalletId, exchange: this.selectedExchange })
						this.notification_type = 'is-danger'
						return this.isSpinnerActive = false
					}
					if (response.data.exchange && !this.isRemoving){
						this.notification_text = this.$t('editModalBelongsToAnotherExchange',
								{wallet: this.targetedWalletId, exchange: this.selectedExchange })
						this.notification_type = 'is-danger'
						return this.isSpinnerActive = false
					}
					if (response.data.exchange != this.selectedExchange && this.isRemoving){
						this.notification_text = this.$t('editModalDoesntBelong',
								{ wallet: this.targetedWalletId, exchange: this.selectedExchange })
						this.notification_type = 'is-danger'
						return this.isSpinnerActive = false
					}

					this.wallet_digest = {
						addr_count: response.data.txs.addr_count,
						total_on_wallet: response.data.txs.total_on_wallets
					}
					this.isOperationPossible = true
					this.getBestPool()
				
				})
		},
		getBestPool () {
			this.axios.get('/api/pool/' + this.selectedExchange).then((response) => {
				if (response.data.pool_id) {
					this.bestPoolId = response.data.pool_id
					this.rewardAmount = response.data.reward_amount
				} else {
					this.notification_text = this.$t('editModalNoRewardAvailable')
					this.notification_type = 'is-warning'
				}
				this.isSpinnerActive = false
			})
		},
		handleOk (bvModalEvt) {
			bvModalEvt.preventDefault()
			const base64url = require('base64url')
			const data = {
				exchange: this.selectedExchange,
				pool_id: this.bestPoolId,
			}

			if (this.urls[0])
				data.url_1 = this.urls[0]
			if (this.urls[1])
				data.url_2 = this.urls[1]
			if (this.urls[2])
				data.url_3 = this.urls[2]
			if (this.urls[3])
				data.url_4 = this.urls[3]
			if (this.urls[4])
				data.url_5 = this.urls[4]

			if (this.isRemoving)
				data.remove_wallet_id = this.targetedWalletId
			else
				data.add_wallet_id = this.targetedWalletId

			const json_string = JSON.stringify(data)
			const base64data = base64url(json_string)
			this.link = (conf.testnet ? 'byteball-tn' : 'byteball') + ':' + conf.aa_address + '?amount='
				+ this.stakeAmount + '&base64data=' + base64data
		}
	},
	computed: {
		isNotificationActive(){
			return !!this.notification_text
		},
			assocExchangesById () {
			return this.$store.state.exchangesById
		},
		assocExchangesByName () {
			return this.$store.state.exchangesByName
		},
		isOkDisabled () {
			return !this.bAreUrlsValid || !this.isOperationPossible
		},
	},
	created() {
		this.selectedExchange = this.propExchange
		this.selectedWalletId = this.propWalletId
	},
	beforeDestroy () {
	},
}