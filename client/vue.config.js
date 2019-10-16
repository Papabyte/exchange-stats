const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    devServer: {
		proxy: 'http://127.0.0.1:1245/',
	},

    configureWebpack: {
		plugins: [new BundleAnalyzerPlugin()],
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
