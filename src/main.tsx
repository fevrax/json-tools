import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";

import { WALManager } from "@/lib/storage/WALManager";
import { getLockManager } from "@/lib/storage/DistributedLockManager";

import "@/styles/globals.css";
import DefaultLayout from "@/layouts/default";
import { FontSizeManager } from "@/components/FontSizeManager";
import UtoolsListener from "@/services/utoolsListener";
import { PWAUpdateManager } from "@/components/pwa/PWAUpdateManager";
import { ThemeColorManager } from "@/components/ThemeColorManager";

// 初始化存储系统
const initializeStorage = async () => {
  try {
    console.log("初始化存储系统...");

    // 1. 恢复 WAL（写前日志）
    const walManager = new WALManager();

    await walManager.recover();

    // 2. 清理过期的分布式锁
    const lockManager = getLockManager();

    await lockManager.cleanupExpiredLocks();

    console.log("存储系统初始化完成");
  } catch (error) {
    console.error("存储系统初始化失败:", error);
  }
};

// 初始化 Utools 监听器
const initializeUtoolsListener = () => {
  setTimeout(() => {
    UtoolsListener.getInstance().initialize();
  }, 0);
};

// 监听应用加载完成事件
if (typeof window !== "undefined") {
  window.addEventListener("load", async () => {
    // 首先初始化存储系统
    await initializeStorage();

    // 然后初始化其他系统
    initializeUtoolsListener();
  });
} else {
  // 在开发环境中直接初始化
  (async () => {
    await initializeStorage();
    initializeUtoolsListener();
  })();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Provider>
        <ThemeColorManager />
        <FontSizeManager />
        <DefaultLayout>
          <App />
        </DefaultLayout>
        {/* PWA 更新管理组件 */}
        <PWAUpdateManager />
      </Provider>
    </HashRouter>
  </React.StrictMode>,
);
