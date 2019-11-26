const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: 'development',
  entry: "./app/index.js",
  output: {
    filename: "app.js",
    path: path.resolve(__dirname, "docs"),
  },
  plugins: [
    new CopyWebpackPlugin([{ from: "./app/index.html", to: "index.html" },{ from: "./app/static/", to: "./static" }]),
  ],
  devServer: { contentBase: path.join(__dirname, "docs"), compress: true },
};
