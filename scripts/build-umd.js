"use strict"

const path = require("path")
const webpack = require("webpack")
const log = require("fancy-log")
// const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")

const CWD = process.cwd()

function startup() {
    const compiler = webpack({
        mode: "production",
        devtool: "cheap-source-map",
        entry: {
            index: path.join(CWD, "scripts/shim/linter.js"),
        },
        target: "web",
        output: {
            path: path.join(CWD, "dist"),
            filename: "index.umd.js",
            library: "Linter",
            libraryTarget: "umd",
            libraryExport: "default",
            umdNamedDefine: true,
            globalObject: "this",
        },
        externals: {},
        resolve: {
            extensions: [".js"],
            alias: {
                esquery: path.resolve(
                    CWD,
                    "node_modules/esquery/dist/esquery.lite.js",
                ),
            },
        },
        module: {
            rules: [
                {
                    // eslint-disable-next-line require-unicode-regexp
                    test: /\.(js)$/,
                    // eslint-disable-next-line require-unicode-regexp
                    exclude: /node_modules|\.d\.ts$/,
                    use: [
                        {
                            loader: "cache-loader",
                            options: {
                                cacheDirectory: path.resolve(
                                    CWD,
                                    "./node_modules/.cache/ts-loader",
                                ),
                            },
                        },
                        "thread-loader",
                        {
                            loader: "babel-loader",
                            options: {
                                presets: ["@babel/preset-env"],
                            },
                        },
                    ],
                },
            ],
        },
        plugins: [
            new webpack.optimize.LimitChunkCountPlugin({
                maxChunks: 1,
            }),
            new webpack.ProgressPlugin((percentage, message, ...args) => {
                console.info(
                    `${(percentage * 100).toFixed(0)}%`,
                    message,
                    ...args,
                )
            }),
            // new BundleAnalyzerPlugin(),
        ],
    })
    // 执行构建
    compiler.run((err, stats) => {
        if (err) {
            log.error(err)
            return
        }
        log.info(stats.toString({ colors: true, chunks: false }))
    })
}

startup()
