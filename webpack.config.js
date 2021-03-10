const path = require('path');
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const sharedConfig = {
    mode: 'development',
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        port: 1340,
        writeToDisk: true
    },
    module: {
        rules: [{
                loader: 'ts-loader',
                test: /\.(ts|tsx)$/,
                include: [path.resolve(__dirname, 'src')],
                exclude: [path.resolve(__dirname, 'node_modules')]
            },
            {
                loader: 'file-loader',
                test: /\.(woff2?|ttf|otf|eot|svg|html)$/,
                options: {
                    name: '[name].[ext]'
                }
            },
            {
                test: /\.scss$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'resolve-url-loader', 'sass-loader']
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            }
        ]
    },
    plugins: [
        new ExtraWatchWebpackPlugin({
            files: [
                './src/**/*.s?css',
                './src/**/*.html',
                './tsconfig.json'
            ],
        }),
        new MiniCssExtractPlugin({ filename: "main.css" })
    ],
    resolve: {
        extensions: ['.ts', '.js'],
        modules: [
            'node_modules',
            path.resolve(__dirname, 'src/')
        ]
    }
}

function createEntryPoint(name) {
    return {
        devtool: "inline-source-map",
        entry: ["@babel/polyfill", path.resolve(__dirname, `src/index.ts`)],
        output: {
            filename: `${name}.js`,
            path: path.resolve(__dirname, `dist/`),
            clean: true,
            publicPath: '/'
        },
        ...sharedConfig
    }
}

module.exports = [
    createEntryPoint("index")
]