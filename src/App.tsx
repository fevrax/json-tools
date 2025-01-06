import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import SettingsPage from "@/pages/setting";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<SettingsPage />} path="/settings" />
    </Routes>
  );
}

export default App;
