const path = require('path');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
// const SriPlugin = require('webpack-subresource-integrity');

module.exports = {
  plugins: [
    // new SriPlugin({hashFuncNames: ['sha256', 'sha384']}),
    new LodashModuleReplacementPlugin(),
    // new HtmlWebpackPlugin({
    //   filename: 'index.html',
    //   chunks: ['index'],
    //   template: './index.html'
    // })
  ],
  cache: {
    type: 'filesystem',
  },
  entry: [
    "./static/js/i.js",
    "./static/js/jquery.min.js",
    "./static/js/client.min.js",
    "./static/js/RecordRTC.min.js",
    "./static/js/adapter-latest.js",
    "./static/js/qrcode.min.js",
    "./static/js/plyr.js",
    "./static/js/html5-qrcode.min.js",
    "./static/js/crypto-js.min.js",
    "./static/js/fix.js",
    "./static/js/tfjs.js",
    "./static/js/webtorrent.min.js",
    "./static/js/html2canvas.min.js",
    "./static/js/dexie.js",
    "./static/js/index.js",
    "./static/js/jszip.min.js",
    "./static/js/p2pchat.js"
  ],
  output: {
    crossOriginLoading: 'anonymous',
    path: path.join(__dirname, './dist'),
    publicPath: "/dist/",
    filename: 'index.js',
    // filename: 'ocr.js',
    // filename: '[name].js',
    // chunkFilename: '[name].chunk.js', // This is important for code splitting
  },
  devServer: {
    static: './dist',
  },
  resolve: {
    modules: [
      "node_modules",
    ],
    extensions: ['.ts', '.js']
  },
  mode: "production",
  optimization: {
    minimizer: [new UglifyJsPlugin()],
  //   splitChunks: {
  //     chunks: 'all', // Split both sync and async chunks
  //     minSize: 0, // Split even the smallest chunks
  //     cacheGroups: {
  //       common: {
  //         test: /[\\/]node_modules[\\/]/, // Extract all dependencies from node_modules into a separate bundle
  //         name: 'common',
  //         chunks: 'all',
  //         enforce: true,
  //       },
  //     },
  //   },
  },
  externals: {
    '@tensorflow/tfjs': 'tf', // 将 '@tensorflow/tfjs' 声明为外部依赖，并映射为 'tf'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.scss/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              url: false,
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions:{
                includePaths: [path.join(__dirname, 'src/styles')],
              }
            }
          }
        ]
      },
    ]
  }
};
