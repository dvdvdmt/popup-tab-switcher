const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');

const conf = {
  mode: 'development',

  entry: {
    background: './src/background.js',
    content: './src/content.js',
    e2eTestCommandsBridge: './src/e2eTestCommandsBridge.js',
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
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
    conf.plugins = [
      ...conf.plugins,
      new webpack.DefinePlugin({
        E2E: 'true',
      }),
    ];
  }
  return conf;
};
