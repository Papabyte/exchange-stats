import Vue from 'vue'
import Router from 'vue-router'
import lazyLoading from './lazyloading'

Vue.use(Router)

export default new Router({
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
			component: lazyLoading('components/ExchangesStats'),
			default: true
		},
		{
			name: 'about',
			path: '/about',
			component: lazyLoading('components/About'),
			default: true
		}
	],
})
