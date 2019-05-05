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

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1,
              localIdentName: '[name]__[local]___[hash:base64:5]',
            },
          },
        ],
      },
    ],
  },

  devtool: 'eval-source-map',
};

module.exports = (env) => {
  const copyWebpackPluginOptions = [
    {
      from: 'src/manifest.json',
      transform(content) {
        // generates the manifest file using the package.json information
        return JSON.stringify({
          description: process.env.npm_package_description,
          version: process.env.npm_package_version,
          ...JSON.parse(content.toString()),
          ...(env.development ? { content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'" } : {}),
        }, null, 2);
      },
    },
    {
      from: 'src/images/',
      to: 'images',
    },
    'src/popup.html',
  ];
  if (env.production) {
    conf.mode = 'production';
    conf.devtool = 'source-map';
    conf.output.path = buildProdFolder;
    conf.plugins = [
      new CopyWebpackPlugin(copyWebpackPluginOptions),
      new webpack.DefinePlugin({
        E2E: 'false',
      }),
    ];
  } else if (env.development) {
    conf.plugins = [
      new CopyWebpackPlugin(copyWebpackPluginOptions),
      new webpack.DefinePlugin({
        E2E: 'false',
      }),
      env.watch ? new ChromeExtensionReloader({
        entries: {
          contentScript: 'content',
          background: 'background',
        },
      }) : () => {},
    ];
  } else if (env.e2e) {
    conf.mode = 'production';
    conf.devtool = 'source-map';
    conf.output.path = buildE2eFolder;
    conf.plugins = [
      new CopyWebpackPlugin(copyWebpackPluginOptions),
      new webpack.DefinePlugin({
        E2E: 'true',
      }),
    ];
  }
  return conf;
};
