import '@babel/polyfill'
import 'mutationobserver-shim'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'
import axios from 'axios'
import VueAxios from 'vue-axios'
import feather from 'vue-icon'

import "@/assets/custom.scss"
import i18n from './i18n'
import store from './store'

Vue.use(feather, 'v-icon');

Vue.use(VueAxios, axios);

Vue.use(Buefy);

Vue.config.productionTip = false;

new Vue({
    el: '#app',
    router,
    i18n,
    store,
    render: h => h(App)
})
