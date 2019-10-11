const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
	devServer: {
		proxy: 'http://127.0.0.1:1245/',
	},
	configureWebpack: {
		plugins: [new BundleAnalyzerPlugin()],
	}
}
