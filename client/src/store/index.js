import Vue from 'vue'
import Vuex from 'vuex'
import Axios from 'axios'

Vue.use(Vuex)

export default new Vuex.Store({
	state: {
		exchangesByName: {},
		exchangesById: {},
		aaParameters: {},
		wasRankingWelcomeMessageClosed: false,
		wasExplorerWelcomeMessageClosed: false,
		wasCrowdSourcingWelcomeMessageClosed: false
	},
	mutations: {
		setExchangesByName(state, data) {
			state.exchangesByName = data;
		},
		setExchangesById(state, data) {
			state.exchangesById = data;
		},
		setWasRankingWelcomeMessageClosed(state, data) {
			state.wasRankingWelcomeMessageClosed = data;
		},
		setWasExplorerWelcomeMessageClosed(state, data) {
			state.wasExplorerWelcomeMessageClosed = data;
		},
		setWasCrowdSourcingWelcomeMessageClosed(state, data) {
			state.wasCrowdSourcingWelcomeMessageClosed = data;
		},
		setAaParameters(state, data) {
			state.aaParameters = data;
		},

	},
	actions: {
		getExchanges(context){
			Axios.get('/api/exchanges').then((response) => {
				const exchangesById = response.data;
				const exchangesByName = {};

				for (var key in exchangesById){
					exchangesByName[exchangesById[key].name] = key;
				}
				context.commit('setExchangesById', exchangesById);
				context.commit('setExchangesByName', exchangesByName);
			});
		},
		getAaParameters(context){
			Axios.get('/api/aa-parameters').then((response) => {
				console.log(response.data);
				context.commit('setAaParameters', response.data);
			});
		}
  },
  modules: {
  }
})
