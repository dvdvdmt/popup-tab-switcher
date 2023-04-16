const path = require('path')
const webpack = require('webpack')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const deepmerge = require('deepmerge')

const buildProdDir = path.join(__dirname, 'build-prod')
const buildDevDir = path.join(__dirname, 'build-dev')
const buildE2eDir = path.join(__dirname, 'build-e2e')
const srcDir = path.join(__dirname, 'src')
const settingsDir = path.join(srcDir, 'settings')
const stylesDir = path.join(srcDir, 'styles')
const nodeModulesDir = path.join(__dirname, 'node_modules')
const e2eDir = path.join(__dirname, 'e2e')
const conf = {
  mode: 'development',
  devtool: false,

  entry: {
    background: './src/background.ts',
    content: './src/content-script/index.ts',
    settings: {
      import: './src/settings/index.js',
      filename: 'settings/index.js',
    },
    settingsSolid: {
      import: './src/settings/solid-js-index.ts',
      filename: 'settings/solid-js-index.js',
    },
  },

  output: {
    filename: '[name].js',
    path: buildDevDir,
  },

  module: {
    rules: [
      {
        exclude: nodeModulesDir,
        test: /\.tsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            configFile: false,
            presets: [
              ['@babel/preset-env', {targets: 'last 2 chrome version'}],
              'babel-preset-solid',
              '@babel/preset-typescript',
            ],
          },
        },
      },
      {
        test: /\.vue$/,
        use: 'vue-loader',
      },
      {
        test: /\.scss$/,
        include: settingsDir,
        exclude: /module\.scss/,
        // type: 'asset/resource',
        use: [
          'vue-style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: [nodeModulesDir, stylesDir],
              },
            },
          },
        ],
      },
      {
        test: /\.module\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[local]__[hash:base64:5]',
              },
              importLoaders: 1,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: [nodeModulesDir, stylesDir],
              },
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        exclude: settingsDir,
        type: 'asset/source',
        use: [
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: [stylesDir],
              },
            },
          },
        ],
      },
    ],
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
}

module.exports = (env) => {
  const copyWebpackPluginOptions = {
    patterns: [
      {
        from: 'src/manifest.json',
        transform: {
          transformer(content) {
            const original = JSON.parse(content.toString())
            // generates the manifest file using the package.json information
            const developmentProps = {
              // content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'",
              key: 'popuptabswitcher', // id: meonejnmljcnoodabklmloagmnmcmlam
              action: {
                default_icon: 'images/icon-48-gray.png',
              },
              icons: {48: 'images/icon-48-gray.png'},
              name: `${original.name} - Development`,
            }
            const e2eProps = {
              key: developmentProps.key,
            }
            return JSON.stringify(
              deepmerge.all([
                original,
                env.development ? developmentProps : {},
                env.e2e ? e2eProps : {},
              ]),
              null,
              2
            )
          },
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
        from: 'src/settings/global-styles/',
        to: 'settings/global-styles',
      },
    ],
  }
  if (env.production) {
    conf.output.path = buildProdDir
    conf.plugins = [
      new CopyWebpackPlugin(copyWebpackPluginOptions),
      new webpack.DefinePlugin({
        E2E: 'false',
        PRODUCTION: 'true',
        DEVELOPMENT: 'false',
      }),
      new VueLoaderPlugin(),
    ]
  } else if (env.development) {
    conf.plugins = [
      new CopyWebpackPlugin(copyWebpackPluginOptions),
      new webpack.DefinePlugin({
        E2E: 'false',
        PRODUCTION: 'false',
        DEVELOPMENT: 'true',
      }),
      // env.WEBPACK_WATCH
      //   ? new ChromeExtensionReloader({
      //       entries: {
      //         contentScript: 'content',
      //         background: 'background',
      //       },
      //     })
      //   : () => {},
      new VueLoaderPlugin(),
    ]
  } else if (env.e2e) {
    conf.output.path = buildE2eDir
    conf.entry['e2e-page-scripts'] = path.join(e2eDir, 'utils', 'page-scripts', 'index.ts')
    conf.entry['e2e-content-script'] = path.join(e2eDir, 'utils', 'e2e-content-script.ts')
    conf.plugins = [
      new CopyWebpackPlugin(copyWebpackPluginOptions),
      new webpack.DefinePlugin({
        E2E: 'true',
        PRODUCTION: 'false',
        DEVELOPMENT: 'false',
      }),
      new VueLoaderPlugin(),
    ]
  }
  return conf
}
