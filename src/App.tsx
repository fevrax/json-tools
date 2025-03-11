import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/indexPage";
import SettingsPage from "@/pages/settingPage";
import ToolboxPage from "@/pages/toolboxPage";
import JsonAIRepairPage from "@/pages/tools/jsonAIRepair.tsx";
import JsonTypeConverter from "@/pages/tools/jsonTypeConverter";
import DataFormatConverter from "@/pages/tools/dataFormatConverter";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<SettingsPage />} path="/settings" />
      <Route element={<ToolboxPage />} path="/toolbox" />
      <Route element={<JsonAIRepairPage />} path="/toolbox/jsonAIRepair" />
      <Route
        element={<JsonTypeConverter />}
        path="/toolbox/jsonTypeConverter"
      />
      <Route
        element={<DataFormatConverter />}
        path="/toolbox/dataFormatConverter"
      />
    </Routes>
  );
}

export default App;
