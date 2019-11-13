import Vue from 'vue'
import Router from 'vue-router'
import lazyLoading from './lazyloading'

Vue.use(Router)

export default new Router({
	mode: 'history',

	routes: [
		{
			name: 'stats',
			path: '/',
			component: lazyLoading('components/ExchangesStats'),
			default: true,
		},
		{
			name: 'exchangesStats',
			path: '/stats/:exchange',
			component: lazyLoading('components/ExchangesStats'),
			props: true
		},
		{
			name: 'explorerInputPaged',
			path: '/explorer/:url_input/:page',
			component: lazyLoading('components/Explorer'),
			props: true
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
			name: 'faq',
			path: '/faq',
			component: lazyLoading('components/Faq')
		}	,
		{
			name: 'crowdsourcing',
			path: '/crowdsourcing',
			component: lazyLoading('components/CrowdSourcing')
		}
	],
})
