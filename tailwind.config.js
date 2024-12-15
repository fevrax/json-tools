import { nextui } from "@nextui-org/theme";

/** @type {import("tailwindcss").Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "zhuziAwan", "sans-serif"],
      },
      // 自定义滚动条隐藏类
      colors: {
        "vscode-dark": "#1e1e1e",
      }
    }
  },
  darkMode: "class",
  plugins: [nextui()]
};

export default config;
