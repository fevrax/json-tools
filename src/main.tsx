import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";

import "@/styles/globals.css";
import DefaultLayout from "@/layouts/default";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Provider>
        <DefaultLayout>
          <App />
        </DefaultLayout>
      </Provider>
    </HashRouter>
  </React.StrictMode>,
);
