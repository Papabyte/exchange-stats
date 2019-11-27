<template>
	<div class="p-3">{{greetingsText}}</div>
</template>

<script>


	export default {
		components: {

		},
		data() {
			return {
				greetingsText:""
			}
		},
		created(){
			this.getData();
			this.timerId = setInterval(this.getData, 60000);
		},
		beforeDestroy(){
			clearInterval(this.timerId);
		},
		methods:{
			getData(){
				this.axios.get('/api/contributors-greeting').then((response) => {
					const arrGreetings = response.data;
					if (arrGreetings[0]){
						if (arrGreetings[0].outcome == 'in')
							this.greetingsText = this.$t('contributorsGreetingAdding', {exchange: arrGreetings[0].exchange, author: arrGreetings[0].author, sponsor: arrGreetings[0].sponsor}); 
						else
							this.greetingsText = this.$t('contributorsGreetingRemoving', {exchange: arrGreetings[0].exchange,author: arrGreetings[0].author, sponsor: arrGreetings[0].sponsor}); 
					}
				});
			}
		}
	}
</script>

<style >

</style>
