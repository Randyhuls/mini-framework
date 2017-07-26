const webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: ['./dist/mini.es5.js'],
    output: {
        filename: 'mini.min.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({
            minimize: false,
            debug: false
        })
       // new webpack.optimize.UglifyJsPlugin()
    ]
};