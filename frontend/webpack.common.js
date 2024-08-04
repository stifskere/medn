const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const {resolve} = require("node:path");

module.exports = {
    entry: "./src/index.tsx",
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
            '@components': resolve(__dirname, "src/components"),
            '@pages': resolve(__dirname, "src/pages"),
            '@hooks': resolve(__dirname, "src/hooks")
        }
    },
    output: {
        filename: "bundle.js",
        path: resolve(__dirname, "dist")
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx|js)$/,
                exclude: /node_modules/,
                use: "babel-loader"
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"]
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/,
                use: "file-loader"
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./index.html"
        }),
        new MiniCssExtractPlugin()
    ]
}