var path = require('path');

module.exports = {
    entry: './src/mini.js',
    output: {
        filename: 'mini.min.js',
        path: path.resolve(__dirname, 'dist')
    }
};