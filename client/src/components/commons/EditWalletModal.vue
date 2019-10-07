<template>
	

	<b-modal id="addWallet" :title="(remove ? 'Remove wallet from exchange ': 'Add wallet to exchange') + ' ' + exchange">
		<b-container fluid >
			<b-row >
				<b-col cols="8" >

				<b-form-input type='number' no-wheel v-model="wallet" placeholder="Enter wallet id"></b-form-input>
				</b-col>
				<b-col cols="2" >

				<b-button v-if="wallet>0 && !isSpinnerActive" v-on:click="check" size="s" v>check</b-button>
						<div v-if="isSpinnerActive" class="text-center w-100">
					<b-spinner label="Spinning"></b-spinner>
				</div>
				</b-col>
			</b-row >
			<b-row >
				<span v-if="text_error">{{text_error}}</span>
			</b-row >

		</b-container>

	</b-modal>


</template>

<script>

export default {	
	components: {
		
	},
	props: ['remove', 'exchange', 'wallet_id'],
	data(){
		return {
			text_error: null,
			wallet: this.wallet_id,
			isSpinnerActive: false
		}
	},
	methods:{

		check(){
			this.isSpinnerActive = true;
			this.wallet = Math.round(this.wallet);
			this.axios.get('/api/getredirection/'+this.wallet).then((response) => {
				console.log(response.data);
				this.wallet = response.data.redirected_id;

				this.axios.get('/api/challenges/'+this.exchange).then((response) => {
					console.log(JSON.stringify(response.data));
				//	this.wallet = response.data.redirected_id;
							this.isSpinnerActive = false;

				});


			});
		},
		getCurrentChallenges(){




		}

	}
}
</script>

<style lang='scss' scoped>
</style>