import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import monacoEditorPlugin from "vite-plugin-monaco-editor-esm";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const ReactCompilerConfig = {};
// https://vitejs.dev/config/

export default defineConfig({
  server: {
    host: "0.0.0.0", // 使用 '0.0.0.0' 允许从任何 IP 访问
    // 如果你想指定本机 IP，可以使用具体 IP 地址，如 '192.168.1.100'
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
      languageWorkers: ["editorWorkerService", "json", "typescript"],
    }),
    nodePolyfills(),
  ],
  optimizeDeps: {
    include: ["vanilla-jsoneditor-cn"],
  },
});
