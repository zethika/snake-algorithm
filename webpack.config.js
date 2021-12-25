const path = require("path");
module.exports = {
    mode: process.env.NODE_ENV || 'development',
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: { "@src": path.resolve(__dirname, "src") },
    },
    output: {
        filename: 'game.js',
        path: path.resolve(__dirname, 'dist'),
    },
};
