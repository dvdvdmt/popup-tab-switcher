const path = require('path');

module.exports = {

  entry: {
    background: './src/background.js',
  },

  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },

  mode: 'development',
};
