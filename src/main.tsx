import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";

import {
  initMonacoGlobally,
  registerGlobalBase64Provider,
} from "@/components/monacoEditor/decorations/decorationInit.ts";

import "@/styles/globals.css";
import DefaultLayout from "@/layouts/default";
import { FontSizeManager } from "@/components/FontSizeManager";
import UtoolsListener from "@/services/utoolsListener";

// 全局初始化Monaco编辑器
initMonacoGlobally().then(() => {
  // 注册全局提供者
  registerGlobalBase64Provider();
});

// 初始化 Utools 监听器
const initializeUtoolsListener = () => {
  // 等待应用完全加载后再初始化
  setTimeout(() => {
    UtoolsListener.getInstance().initialize();
  }, 0);
};

// 监听应用加载完成事件
if (typeof window !== 'undefined') {
  window.addEventListener('load', initializeUtoolsListener);
} else {
  // 在开发环境中直接初始化
  initializeUtoolsListener();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Provider>
        <FontSizeManager />
        <DefaultLayout>
          <App />
        </DefaultLayout>
      </Provider>
    </HashRouter>
  </React.StrictMode>,
);
