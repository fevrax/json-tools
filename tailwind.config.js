/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'vscode-dark': '#1e1e1e',
        'dark': '#141414',
      },
    },
  },
  plugins: [],
}
