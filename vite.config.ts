import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import monacoEditorPlugin from "vite-plugin-monaco-editor-esm";

const ReactCompilerConfig = {};
// https://vitejs.dev/config/

export default defineConfig({
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
  ],
  optimizeDeps: {
    include: ["vanilla-jsoneditor-cn"],
  },
});
