// filepath: /home/ffernandes/bpmnModeler/webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // Added HtmlWebpackPlugin

module.exports = {
  entry: './src/index.js',  // Entry point of your app
  output: {
    filename: 'bundle.js',  // Output bundle name
    path: path.resolve(__dirname, 'dist'),  // Output directory
  },
  mode: 'development',  // 'production' for optimized builds
  devServer: {
    static: './dist',  // Serves files from 'dist'
    hot: true,         // Hot Module Replacement (HMR)
  },
  module: {
    rules: [
      {
        test: /\.bpmn$/, // Match .bpmn files
        use: 'raw-loader', // Use raw-loader to import them as strings
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',  // Uses your HTML as a template
    }),
  ],
};