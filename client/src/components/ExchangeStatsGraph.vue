<template>
	<b-col offset-lg="1" lg="10" cols="12" class="py-3">
		<b-row >
			<b-col cols="12" class="py-3">
				<h3 class="text-center">{{$t('rankingGraphTitle', {exchange: assocExchanges[exchange]})}}</h3>
			</b-col >
		</b-row >
		<b-row class="main-block">
			<b-col cols="12" class="py-3">
				<highcharts :options="chartOptions"></highcharts>
			</b-col >
		</b-row >
	</b-col >
</template>

<script>
import {Chart} from 'highcharts-vue'

const conf = require("../conf.js");

export default {
	components: {
		highcharts: Chart 
	},
	props: {
		exchange: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			chartOptions: {
				series: []
			}
		}
	},
	computed:{
		assocExchanges() {
			return this.$store.state.exchangesById;
		}
	},
	created(){
		this.chartOptions.title = {text: ''};
		this.axios.get('/api/exchange-history/'+ this.exchange).then((response) => {
			const data = response.data;
			this.chartOptions.zoomType = 'x';	
			this.chartOptions.xAxis = {
				type: 'datetime',
				dateTimeLabelFormats: {
					day: '%e %b %y',
				}
			};
			this.chartOptions.yAxis = {
				labels: {
					format: '{value} BTC'
				}
			};
			this.chartOptions.series.push({
				data: data.map(function(row){
					return {
						x: row.time_start*1000,
						x: row.time_end*1000,
						y: row.balance/100000000
					}
				}),
				name: "Balance"
			});
			this.chartOptions.series.push({
				data: data.map(function(row){
					return {
						x: row.time_start*1000,
						x: row.time_end*1000,
						y: row.total_deposited/100000000
					}
				}),
				name: "Daily deposited"
			});
			this.chartOptions.series.push({
				data: data.map(function(row){
					return {
						x: row.time_start*1000,
						x: row.time_end*1000,
						y: row.total_withdrawn/100000000
					}
				}),
				name: "Daily withdrawn"
			});
		});
		console.log(this.$t('rankingGraphPageTitle', {exchange: this.assocExchanges[this.exchange], website_name: conf.website_name}));
		document.title = this.$t('rankingGraphPageTitle', {exchange: this.assocExchanges[this.exchange], website_name: conf.website_name});
		document.getElementsByName('description')[0].setAttribute('content',this.$t("rankingGraphDescription",{exchange: this.assocExchanges[this.exchange]}));
	}
}
</script>

