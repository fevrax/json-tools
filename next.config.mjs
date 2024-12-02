import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",
  // 仅在生产构建时添加相对路径前缀
  ...(process.env.NODE_ENV === "production" && {
    assetPrefix: "./", // 仅在生产构建时添加相对路径前缀
  }),
  images: {
    unoptimized: true, // 对于静态导出，需要禁用图片优化
  },
  reactStrictMode: true,
  webpack: (config, options) => {
    if (!options.isServer) {
      config.plugins.push(
        new MonacoWebpackPlugin({
          // you can add other languages here as needed
          // (list of languages: https://github.com/microsoft/monaco-editor/tree/main/src/basic-languages)
          languages: ["json"],
          filename: "static/[name].worker.[contenthash].js",
        }),
      );
    }

    return config;
  },
};

export default nextConfig;
