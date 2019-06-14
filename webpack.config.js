const path = require('path');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');

const buildProdDir = path.join(__dirname, 'build-prod');
const buildDevDir = path.join(__dirname, 'build-dev');
const buildE2eDir = path.join(__dirname, 'build-e2e');
const popupDir = path.join(__dirname, 'src/popup');
const srcDir = path.join(__dirname, 'src');
const nodeModulesDir = path.join(__dirname, 'node_modules');

const sassGlobals = '@import "variables";';

const conf = {
  mode: 'development',

  entry: {
    background: './src/background.js',
    content: './src/content.js',
    popup: './src/popup/popup.js',
    e2eTestCommandsBridge: './src/e2eTestCommandsBridge.js',
  },

  output: {
    filename: '[name].js',
    path: buildDevDir,
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'svg-sprite-loader',
            options: {
              spriteModule: './src/utils/sprite',
            },
          },
          {
            loader: 'svgo-loader',
            options: {
              plugins: [
                { removeTitle: true },
                { convertColors: { shorthex: false } },
                { convertPathData: false },
              ],
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        include: popupDir,
        use: ['style-loader', 'css-loader', {
          loader: 'sass-loader',
          options: {
            data: sassGlobals,
            includePaths: [nodeModulesDir, srcDir],
          },
        }],
      },
      {
        test: /\.scss$/,
        exclude: popupDir,
        use: ['raw-loader', {
          loader: 'sass-loader',
          options: {
            data: sassGlobals,
            includePaths: [srcDir],
          },
        }],
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
          ...(env.development ? { content_security_policy: 'script-src \'self\' \'unsafe-eval\'; object-src \'self\'' } : {}),
        }, null, 2);
      },
    },
    {
      from: 'src/images/',
      to: 'images',
    },
    'src/popup/popup.html',
    {
      from: 'src/popup/fonts/',
      to: 'fonts',
    },
  ];
  if (env.production) {
    conf.mode = 'production';
    conf.devtool = 'source-map';
    conf.output.path = buildProdDir;
    conf.plugins = [
      new CopyWebpackPlugin(copyWebpackPluginOptions),
      new webpack.DefinePlugin({
        E2E: 'false',
      }),
      new VueLoaderPlugin(),
    ];
  } else if (env.development) {
    conf.plugins = [
      new CopyWebpackPlugin(copyWebpackPluginOptions),
      new webpack.DefinePlugin({
        E2E: 'false',
      }),
      env.watch ? new ChromeExtensionReloader({
        entries: {
          contentScript: 'PopupTabSwitcher.scss.scss',
          background: 'background',
        },
      }) : () => {
      },
      new VueLoaderPlugin(),
    ];
  } else if (env.e2e) {
    conf.mode = 'production';
    conf.devtool = 'source-map';
    conf.output.path = buildE2eDir;
    conf.plugins = [
      new CopyWebpackPlugin(copyWebpackPluginOptions),
      new webpack.DefinePlugin({
        E2E: 'true',
      }),
      new VueLoaderPlugin(),
    ];
  }
  return conf;
};
