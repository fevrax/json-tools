import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/indexPage";
import SettingsPage from "@/pages/settingPage";
import ToolboxPage from "@/pages/toolboxPage";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<SettingsPage />} path="/settings" />
      <Route element={<ToolboxPage />} path="/toolbox" />
    </Routes>
  );
}

export default App;
