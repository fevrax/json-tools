// src/store/settingsStore.ts
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

interface SettingsState {
  darkMode: boolean;
  editDataSaveLocal: boolean;
  expandTabs: boolean;
  editorCDN: string;
  setDarkMode: (value: boolean) => void;
  setEditDataSaveLocal: (value: boolean) => void;
  setExpandTabs: (value: boolean) => void;
  setEditorCDN: (value: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        // 初始状态
        darkMode: false,
        editDataSaveLocal: false,
        expandTabs: false,
        editorCDN: "false",

        // actions
        setDarkMode: (value) => set({ darkMode: value }),
        setEditDataSaveLocal: (value) => set({ editDataSaveLocal: value }),
        setExpandTabs: (value) => set({ expandTabs: value }),
        setEditorCDN: (value) => set({ editorCDN: value }),
      }),
      {
        name: "settings-storage", // 持久化存储的key名
      },
    ),
    {
      name: "settingsStore", // 调试工具的key名
    },
  ),
);
