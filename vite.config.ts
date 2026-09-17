import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import monacoEditorPlugin from "vite-plugin-monaco-editor-esm";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { VitePWA } from "vite-plugin-pwa";

const ReactCompilerConfig = {};
// https://vitejs.dev/config/

export default defineConfig({
  server: {
    host: "0.0.0.0", // 使用 '0.0.0.0' 允许从任何 IP 访问
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler", // or 'modern'
      },
    },
  },
  base: "./",
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    tsconfigPaths(),
    monacoEditorPlugin({
      languageWorkers: ["editorWorkerService", "json"],
    }),
    nodePolyfills(),
    VitePWA({
      registerType: "prompt",
      strategies: "generateSW",
      // public 目录中的静态资源已由 globPatterns 收集，避免与 manifest 图标重复。
      includeManifestIcons: false,
      workbox: {
        // Monaco 主包较大；完整预缓存可确保所有本地工具首次断网也可使用。
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: false,
      },
      devOptions: {
        enabled: false, // 在开发环境中禁用 PWA
        type: "module",
      },
      manifest: {
        name: "JSON Tools - 多功能JSON处理助手",
        short_name: "JSON Tools",
        description: "强大的JSON工具集，支持格式化、验证、转换、编辑等多种功能",
        id: "./",
        lang: "zh-CN",
        background_color: "#f4f4f5",
        display: "standalone",
        scope: "./",
        start_url: "./",
        theme_color: "#f4f4f5",
        categories: ["productivity", "developer", "utilities"],
        handle_links: "auto",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "格式化 JSON",
            short_name: "格式化",
            description: "快速格式化 JSON 数据",
            url: "./",
            icons: [
              {
                src: "pwa-192x192.png",
                sizes: "192x192",
                type: "image/png",
              },
            ],
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ["vanilla-jsoneditor-cn"],
  },
});
