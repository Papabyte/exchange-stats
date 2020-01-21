import Vue from 'vue'
import Vuex from 'vuex'
import Axios from 'axios'

const conf = require('../conf.js')

Vue.use(Vuex)

export default new Vuex.Store({
	state: {
		exchangesByName: {},
		exchangesById: {},
		aaParameters: {},
		wasRankingWelcomeMessageClosed: false,
		wasExplorerWelcomeMessageClosed: false,
		wasCrowdSourcingWelcomeMessageClosed: false,
		arrKnownEvents: [],
		arrBlacklistedDomains: []
	},
	mutations: {
		setKnownEvents(state, data){
			state.arrKnownEvents = data;
		},
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
		setarrBlacklistedDomains(state, data) {
			state.arrBlacklistedDomains = data;
		},

	},
	actions: {
		getExchanges(context){
			Axios.get('/api/exchanges').then((response) => {
				const exchangesById = response.data;
				const exchangesByName = {};
				const arrBlacklistedDomains = [];
				for (var key in exchangesById){
					exchangesByName[exchangesById[key].name] = key;
					var domain = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/.exec(exchangesById[key].url);
					if (domain)
						arrBlacklistedDomains.push(domain[1]);
				}
				context.commit('setExchangesById', exchangesById);
				context.commit('setExchangesByName', exchangesByName);
				context.commit('setarrBlacklistedDomains', arrBlacklistedDomains.concat(conf.blacklisted_domains));
			});
		},
		getAaParameters(context){
			Axios.get('/api/aa-parameters').then((response) => {
				context.commit('setAaParameters', response.data);
			});
		}
  },
  modules: {
  }
})
