// src/store/settingsStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { storage } from "@/lib/indexedDBStore";

export type ChatStyle = "bubble" | "document";

export interface SettingsState {
  editDataSaveLocal: boolean;
  expandSidebar: boolean;
  monacoEditorCDN: "local" | "cdn";
  chatStyle: ChatStyle;
  setEditDataSaveLocal: (value: boolean) => void;
  setExpandSidebar: (value: boolean) => void;
  setMonacoEditorCDN: (value: "local" | "cdn") => void;
  setChatStyle: (value: ChatStyle) => void;
  setSettings: (settings: SettingsState) => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    (set) => ({
      // 初始状态
      editDataSaveLocal: false,
      expandSidebar: false,
      monacoEditorCDN: "local",
      chatStyle: "bubble",

      // actions
      setEditDataSaveLocal: (value) => set({ editDataSaveLocal: value }),
      setExpandSidebar: (value) => set({ expandSidebar: value }),
      setMonacoEditorCDN: (value) => set({ monacoEditorCDN: value }),
      setChatStyle: (value) => set({ chatStyle: value }),
      setSettings: (settings) => {
        set(settings);
      },
    }),
    {
      name: "settingsStore", // 调试工具的key名
    },
  ),
);

useSettingsStore.subscribe((state) => {
  const data = {
    editDataSaveLocal: state.editDataSaveLocal,
    expandSidebar: state.expandSidebar,
    monacoEditorCDN: state.monacoEditorCDN,
    chatStyle: state.chatStyle,
  };

  storage.setItem("settings", data);
});
