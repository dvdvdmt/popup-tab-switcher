const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');

const conf = {
  mode: 'development',

  entry: {
    background: './src/background.js',
    content: './src/content.js',
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },

  devtool: 'cheap-module-source-map',

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

module.exports = (env, argv) => {
  if (env.production) {
    conf.mode = argv.mode;
    conf.devtool = 'source-map';
  } else if (env.development) {
    conf.plugins = [
      ...conf.plugins,
      new ChromeExtensionReloader(),
    ];
  }
  return conf;
};
