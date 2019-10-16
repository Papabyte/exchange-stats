import Vue from 'vue'
import Vuex from 'vuex'
import Axios from 'axios'

Vue.use(Vuex)

export default new Vuex.Store({
	state: {
		exchanges: [],
		exchangesById: {},
		wasRankingWelcomeMessageClosed: false
	},
	mutations: {
		setExchanges(state, data) {
			state.exchanges = data;
		},
		setExchangesById(state, data) {
			state.exchangesById = data;
		},
		setWasRankingWelcomeMessageClosed(state, data) {
			state.wasRankingWelcomeMessageClosed = data;
		}
	},
	actions: {
		getExchanges(context){
			Axios.get('/api/exchanges').then((response) => {
				const arrExchanges = response.data.sort(function(a,b){
					return a.name.toUpperCase() > b.name.toUpperCase();
				});
				const exchangesById = {};
				arrExchanges.forEach(function(row){
					exchangesById[row.id] = row.name
				});
				context.commit('setExchangesById', exchangesById);
				context.commit('setExchanges', arrExchanges);
			});
		}
  },
  modules: {
  }
})
