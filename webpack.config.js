const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const conf = {
  mode: 'development',

  entry: {
    background: './src/background.js',
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
    ]),
  ],

};

module.exports = (env, argv) => {
  if (env.production) {
    conf.mode = argv.mode;
    conf.devtool = 'source-map';
  }
  return conf;
};
