const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");
const { merge } = require("webpack-merge");

const isProd = process.env.NODE_ENV === "production";
const baseConfig = {
    entry: {
        background: "./src/background.ts",
        popup: "./src/popup.ts"
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
        clean: true
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },
    cache: false,
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    force: true,
                    from: "manifest.json",
                    to: ".",
                    context: "src"
                },
                {
                    force: true,
                    from: "*.html",
                    to: ".",
                    context: "src"
                },
                {
                    force: true,
                    from: "*.css",
                    to: ".",
                    context: "src"
                },
            ]
        })
    ]
};

const devConfig = {
    mode: "development",
    devtool: "inline-source-map"
};

const prodConfig = {
    mode: "production",
    devtool: false,
    optimization: {
        moduleIds: "deterministic",
        chunkIds: "deterministic"
    },
    performance: {
        hints: false
    },
    stats: "errors-only",
};

module.exports = isProd
    ? merge(baseConfig, prodConfig)
    : merge(baseConfig, devConfig);
