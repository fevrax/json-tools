import {
  Fira_Code as FontMono,
  Inter as FontSans,
  JetBrains_Mono as JetBrainsMono,
} from "next/font/google";
import localFont from "next/font/local";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const jetbrainsMono = JetBrainsMono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const zhuziAwan = localFont({
  src: [
    {
      path: "../public/fonts/zhuziAwan.woff2",
      weight: "100",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-zhuziAwan",
});
