const {merge} = require("webpack-merge");
const common = require("./webpack.common");

module.exports = merge(common, {
    mode: "development",
    devtool: "inline-source-map",
    devServer: {
        port: 3000,
        hot: true,
        historyApiFallback: true,
        proxy: [
            {
                context: ["/api/"],
                target: "http://localhost:3001",
                pathRewrite: { "^/api": "" },
                changeOrigin: true
            }
        ]
    },
    stats: {
        errorDetails: true
    }
});
