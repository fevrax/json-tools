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

// 全局初始化Monaco编辑器
initMonacoGlobally().then(() => {
  // 注册全局提供者
  registerGlobalBase64Provider();
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Provider>
        <DefaultLayout>
          <App />
        </DefaultLayout>
      </Provider>
    </HashRouter>
  </React.StrictMode>,
);
