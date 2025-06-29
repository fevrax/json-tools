// src/store/settingsStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { storage } from "@/lib/indexedDBStore";

// 定义聊天窗口样式类型
export type ChatStyle = "bubble" | "document";

// 全局设置状态接口，包含解码器配置
export interface SettingsState {
  editDataSaveLocal: boolean;
  expandSidebar: boolean;
  monacoEditorCDN: "local" | "cdn";
  chatStyle: ChatStyle;
  // 解码器设置
  timestampDecoderEnabled: boolean;
  base64DecoderEnabled: boolean;
  unicodeDecoderEnabled: boolean;
  urlDecoderEnabled: boolean;
  setEditDataSaveLocal: (value: boolean) => void;
  setExpandSidebar: (value: boolean) => void;
  setMonacoEditorCDN: (value: "local" | "cdn") => void;
  setChatStyle: (value: ChatStyle) => void;
  // 解码器setter方法
  setTimestampDecoderEnabled: (value: boolean) => void;
  setBase64DecoderEnabled: (value: boolean) => void;
  setUnicodeDecoderEnabled: (value: boolean) => void;
  setUrlDecoderEnabled: (value: boolean) => void;
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
      // 解码器默认启用
      timestampDecoderEnabled: true,
      base64DecoderEnabled: true,
      unicodeDecoderEnabled: true,
      urlDecoderEnabled: true,

      // actions
      setEditDataSaveLocal: (value) => set({ editDataSaveLocal: value }),
      setExpandSidebar: (value) => set({ expandSidebar: value }),
      setMonacoEditorCDN: (value) => set({ monacoEditorCDN: value }),
      setChatStyle: (value) => set({ chatStyle: value }),
      // 解码器setter实现
      setTimestampDecoderEnabled: (value) => set({ timestampDecoderEnabled: value }),
      setBase64DecoderEnabled: (value) => set({ base64DecoderEnabled: value }),
      setUnicodeDecoderEnabled: (value) => set({ unicodeDecoderEnabled: value }),
      setUrlDecoderEnabled: (value) => set({ urlDecoderEnabled: value }),
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
    // 保存解码器设置
    timestampDecoderEnabled: state.timestampDecoderEnabled,
    base64DecoderEnabled: state.base64DecoderEnabled,
    unicodeDecoderEnabled: state.unicodeDecoderEnabled,
    urlDecoderEnabled: state.urlDecoderEnabled,
  };

  storage.setItem("settings", data);
});
