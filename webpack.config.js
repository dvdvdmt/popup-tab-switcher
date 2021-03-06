const path = require('path');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');
const deepmerge = require('deepmerge');

const buildProdDir = path.join(__dirname, 'build-prod');
const buildDevDir = path.join(__dirname, 'build-dev');
const buildE2eDir = path.join(__dirname, 'build-e2e');
const srcDir = path.join(__dirname, 'src');
const settingsDir = path.join(srcDir, 'settings');
const stylesDir = path.join(srcDir, 'styles');
const nodeModulesDir = path.join(__dirname, 'node_modules');
const sassGlobals = '@import "variables";';
const conf = {
  mode: 'development',

  entry: {
    background: './src/background.ts',
    content: './src/content.ts',
    'settings/index': './src/settings/index.js',
  },

  output: {
    filename: '[name].js',
    path: buildDevDir,
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: nodeModulesDir,
      },
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
                {removeTitle: true},
                {convertColors: {shorthex: false}},
                {convertPathData: false},
              ],
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        include: settingsDir,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              data: sassGlobals,
              includePaths: [nodeModulesDir, stylesDir],
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        exclude: settingsDir,
        use: [
          'raw-loader',
          {
            loader: 'sass-loader',
            options: {
              data: sassGlobals,
              includePaths: [stylesDir],
            },
          },
        ],
      },
    ],
  },

  devtool: 'eval-source-map',

  resolve: {
    extensions: ['.ts', '.js'],
  },
};

module.exports = (env) => {
  const copyWebpackPluginOptions = [
    {
      from: 'src/manifest.json',
      transform(content) {
        const original = JSON.parse(content.toString());
        // generates the manifest file using the package.json information
        const developmentProps = {
          content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'",
          key: 'popuptabswitcher', // id: meonejnmljcnoodabklmloagmnmcmlam
          browser_action: {
            default_icon: 'images/icon-48-gray.png',
          },
          icons: {48: 'images/icon-48-gray.png'},
          name: `${original.name} - Development`,
        };
        const e2eProps = {
          key: developmentProps.key,
        };
        return JSON.stringify(
          deepmerge.all([
            original,
            env.development ? developmentProps : {},
            env.e2e ? e2eProps : {},
          ]),
          null,
          2
        );
      },
    },
    {
      from: 'icon*.png',
      to: 'images/',
      context: 'src/images',
    },
    {
      from: 'src/settings/index.html',
      to: 'settings',
    },
    {
      from: 'src/settings/fonts/',
      to: 'settings/fonts',
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
        PRODUCTION: 'true',
      }),
      new VueLoaderPlugin(),
    ];
  } else if (env.development) {
    conf.plugins = [
      new CopyWebpackPlugin(copyWebpackPluginOptions),
      new webpack.DefinePlugin({
        E2E: 'false',
        PRODUCTION: 'false',
      }),
      env.watch
        ? new ChromeExtensionReloader({
            entries: {
              contentScript: 'content',
              background: 'background',
            },
          })
        : () => {},
      new VueLoaderPlugin(),
    ];
  } else if (env.e2e) {
    conf.mode = 'production';
    conf.devtool = 'source-map';
    conf.entry['e2e-test-commands-bridge'] = path.resolve(srcDir, 'e2e-test-commands-bridge.ts');
    conf.output.path = buildE2eDir;
    conf.plugins = [
      new CopyWebpackPlugin(copyWebpackPluginOptions),
      new webpack.DefinePlugin({
        E2E: 'true',
        PRODUCTION: 'false',
      }),
      new VueLoaderPlugin(),
    ];
  }
  return conf;
};
