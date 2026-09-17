import { useEffect } from "react";
import { useTheme } from "next-themes";

const THEME_COLORS = {
  light: "#f4f4f5",
  dark: "#27272a",
} as const;

/** Keeps the installed PWA title bar in sync with the active app theme. */
export function ThemeColorManager() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const themeColor = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    const appleStatusBar = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-status-bar-style"]',
    );

    if (resolvedTheme !== "light" && resolvedTheme !== "dark") {
      return;
    }

    if (themeColor) {
      themeColor.content = THEME_COLORS[resolvedTheme];
    }
    if (appleStatusBar) {
      appleStatusBar.content = resolvedTheme === "dark" ? "black" : "default";
    }
  }, [resolvedTheme]);

  return null;
}
