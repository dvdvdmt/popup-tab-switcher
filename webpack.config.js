const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');

const buildProdFolder = path.resolve(__dirname, 'build-prod');
const buildDevFolder = path.resolve(__dirname, 'build-dev');
const buildE2eFolder = path.resolve(__dirname, 'build-e2e');
const conf = {
  mode: 'development',

  entry: {
    background: './src/background.js',
    content: './src/content.js',
    e2eTestCommandsBridge: './src/e2eTestCommandsBridge.js',
  },

  output: {
    filename: '[name].js',
    path: buildDevFolder,
  },

  devtool: 'eval-source-map',

  plugins: [
    new CopyWebpackPlugin([
      'src/manifest.json',
      {
        from: 'src/images/',
        to: 'images',
      },
      'src/popup.html',
      'src/content.css',
    ]),
  ],
};

module.exports = (env) => {
  if (env.production) {
    conf.mode = 'production';
    conf.devtool = 'source-map';
    conf.output.path = buildProdFolder;
    conf.plugins = [
      ...conf.plugins,
      new webpack.DefinePlugin({
        E2E: 'false',
      }),
    ];
  } else if (env.development) {
    conf.plugins = [
      ...conf.plugins,
      new webpack.DefinePlugin({
        E2E: 'false',
      }),
      new ChromeExtensionReloader(),
    ];
  } else if (env.e2e) {
    conf.output.path = buildE2eFolder;
    conf.plugins = [
      ...conf.plugins,
      new webpack.DefinePlugin({
        E2E: 'true',
      }),
    ];
  }
  return conf;
};
