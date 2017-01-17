module.exports = {
  //define entry point
  entry: "./src/app.js",

  //define outout point
  output: {
    path: 'dist',
    filename: 'app.min.js'
  },

  module: {
    loaders: [
      { //Babel
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.scss$/,
        loader: 'style-loader!css-loader!sass-loader'
      }
    ]
  }
}
