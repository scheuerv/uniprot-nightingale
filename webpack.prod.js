const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const sharedConfig = {
    mode: "production",
    module: {
        rules: [
            {
                loader: "ts-loader",
                test: /\.(ts|tsx)$/,
                include: [path.resolve(__dirname, "src")],
                options: {
                    configFile: path.resolve(__dirname, "tsconfig.json")
                }
            },
            {
                loader: "file-loader",
                test: /\.(woff2?|ttf|otf|eot|svg|html)$/,
                options: {
                    name: "[name].[ext]"
                }
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "sass-loader"
                ]
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader"]
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({ filename: "main.css" })
    ],
    resolve: {
        extensions: [".ts", ".js"],
        modules: ["node_modules", path.resolve(__dirname, "src/")]
    }
};

function createEntryPoint(name) {
    return {
        devtool: "inline-source-map",
        entry: [
            path.resolve(__dirname, `src/index.ts`)
        ],
        output: {
            filename: `${name}.js`,
            path: path.resolve(__dirname, `dist/`),
            publicPath: "/",
            library: {
                type: "assign",
                name: "UniprotNightingale"
            }
        },
        ...sharedConfig
    };
}

function createExampleEntryPoint(name) {
    return {
        devtool: "inline-source-map",
        entry: [path.resolve(__dirname, `src/examples/index.ts`)],
        output: {
            filename: `${name}.js`,
            path: path.resolve(__dirname, `dist/examples`),
            library: {
                type: 'assign',
                name: 'UniprotNightingaleExamples'
            }
        },
        externals: {
            "fs": 'require("fs")'
        },
        ...sharedConfig
    }
}

module.exports = [
    createEntryPoint("index"),
    createExampleEntryPoint("example")
];
