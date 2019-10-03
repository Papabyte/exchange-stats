import Vue from 'vue'
import Router from 'vue-router'
import lazyLoading from './lazyloading'

Vue.use(Router)

export default new Router({
	mode: 'history',

	routes: [
		{
			name: 'exchangeStats',
			path: '/',
			component: lazyLoading('components/ExchangesStats'),
			default: true
		},
		{
			name: 'exchangesStats',
			path: '/stats',
			component: lazyLoading('components/ExchangesStats')
		},
		{
			name: 'explorerInput',
			path: '/explorer/:url_input',
			component: lazyLoading('components/Explorer'),
			props: true
		},
		{
			name: 'explorer',
			path: '/explorer/',
			component: lazyLoading('components/Explorer')
		},
		{
			name: 'about',
			path: '/about',
			component: lazyLoading('components/About')
		}	,
		{
			name: 'crowdsourcing',
			path: '/crowdsourcing',
			component: lazyLoading('components/CrowdSourcing')
		}
	],
})
