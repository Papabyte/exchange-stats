module.exports = {
	devServer: {
		proxy: process.env.local_server ? 'http://127.0.0.1:1245/' : 'http://91.121.57.43/',
	},
	configureWebpack: {

	},
	pluginOptions: {
		i18n: {
			locale: 'en',
			fallbackLocale: 'en',
			localeDir: 'locales',
			enableInSFC: false
		}
	}
}
