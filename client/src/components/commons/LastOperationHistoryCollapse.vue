<template>
	<section>

		<b-collapse class="card" :open="false" aria-id="contentIdForA11y3">
				<div
						slot="trigger" 
						slot-scope="props"
						class="card-header"
						role="button"
						aria-controls="contentIdForA11y3">
						<p class="card-header-title">
							{{$t('LastOperationHistoryCollapseLastOperationForThisPair')}}
						</p>
						<a class="card-header-icon">
								<b-icon
										:icon="props.open ? 'menu-down' : 'menu-up'">
								</b-icon>
						</a>
				</div>
				<div class="card-content">
					<h5 class="title is-5 is-marginless mb-05">
					{{getTitle}}
					</h5>
					<div v-if="objData" class="content">
						<operation-history :propHistoryData="objData" />
					</div>
				</div>
		</b-collapse>
	</section>
</template>

<script>
import OperationHistory from './OperationHistory.vue';

	export default {
		components: {
			OperationHistory,
		},
		props: {
			exchange: {
				type: String,
				required: true
			},
			walletId: {
				type: Number,
				required: true
			},
		},
		data(){
			return {
				objData: null
			}
		},
		computed: {
			getTitle: function(){
				if (!this.objData)
					return 'loading...'
				else if (this.objData.operation.initial_outcome == 'in') {
					return this.$t('crowdSourcingOperationsAddXToX', {wallet: this.walletId, exchange: this.exchange});
				}
				else
					return this.$t('crowdSourcingOperationsRemoveXFromX', {wallet: this.walletId, exchange: this.exchange});
			}
		},
		created () {
			this.axios.get('/api/last-operation-history/' +this.walletId + '/' + this.exchange).then((response) => {
				this.objData = response.data
			});
		},
	}
</script>

<style lang='scss'>
</style>
