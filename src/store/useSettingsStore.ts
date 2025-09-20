// src/store/settingsStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { storage } from "@/lib/indexedDBStore";

// 定义聊天窗口样式类型
export type ChatStyle = "bubble" | "document";

// 定义字体大小类型
export type FontSize = "small" | "medium" | "large";

// 全局设置状态接口，包含解码器配置
export interface SettingsState {
  editDataSaveLocal: boolean;
  expandSidebar: boolean;
  monacoEditorCDN: "local" | "cdn";
  chatStyle: ChatStyle;
  // 字体大小设置
  fontSize: FontSize;
  // 解码器设置
  timestampDecoderEnabled: boolean;
  base64DecoderEnabled: boolean;
  unicodeDecoderEnabled: boolean;
  urlDecoderEnabled: boolean;
  // 编辑器默认设置
  defaultIndentSize: number;
  // 快捷键设置
  newTabShortcut: string;
  closeTabShortcut: string;
  setEditDataSaveLocal: (value: boolean) => void;
  setExpandSidebar: (value: boolean) => void;
  setMonacoEditorCDN: (value: "local" | "cdn") => void;
  setChatStyle: (value: ChatStyle) => void;
  // 字体大小setter方法
  setFontSize: (value: FontSize) => void;
  // 解码器setter方法
  setTimestampDecoderEnabled: (value: boolean) => void;
  setBase64DecoderEnabled: (value: boolean) => void;
  setUnicodeDecoderEnabled: (value: boolean) => void;
  setUrlDecoderEnabled: (value: boolean) => void;
  // 编辑器默认设置setter方法
  setDefaultIndentSize: (value: number) => void;
  // 快捷键setter方法
  setNewTabShortcut: (value: string) => void;
  setCloseTabShortcut: (value: string) => void;
  setSettings: (settings: SettingsState) => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    (set) => ({
      // 初始状态
      editDataSaveLocal: true,
      expandSidebar: false,
      monacoEditorCDN: "local",
      chatStyle: "bubble",
      // 字体大小设置
      fontSize: "medium",
      // 解码器默认启用
      timestampDecoderEnabled: true,
      base64DecoderEnabled: true,
      unicodeDecoderEnabled: true,
      urlDecoderEnabled: true,
      // 编辑器默认设置
      defaultIndentSize: 4,
      // 快捷键默认设置
      newTabShortcut: "Ctrl+Shift+T",
      closeTabShortcut: "Ctrl+Shift+W",

      // actions
      setEditDataSaveLocal: (value) => set({ editDataSaveLocal: value }),
      setExpandSidebar: (value) => set({ expandSidebar: value }),
      setMonacoEditorCDN: (value) => set({ monacoEditorCDN: value }),
      setChatStyle: (value) => set({ chatStyle: value }),
      // 字体大小setter实现
      setFontSize: (value) => set({ fontSize: value }),
      // 解码器setter实现
      setTimestampDecoderEnabled: (value) => set({ timestampDecoderEnabled: value }),
      setBase64DecoderEnabled: (value) => set({ base64DecoderEnabled: value }),
      setUnicodeDecoderEnabled: (value) => set({ unicodeDecoderEnabled: value }),
      setUrlDecoderEnabled: (value) => set({ urlDecoderEnabled: value }),
      // 编辑器默认设置setter实现
      setDefaultIndentSize: (value) => set({ defaultIndentSize: value }),
      // 快捷键setter实现
      setNewTabShortcut: (value) => set({ newTabShortcut: value }),
      setCloseTabShortcut: (value) => set({ closeTabShortcut: value }),
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
    // 保存字体大小设置
    fontSize: state.fontSize,
    // 保存解码器设置
    timestampDecoderEnabled: state.timestampDecoderEnabled,
    base64DecoderEnabled: state.base64DecoderEnabled,
    unicodeDecoderEnabled: state.unicodeDecoderEnabled,
    urlDecoderEnabled: state.urlDecoderEnabled,
    // 保存编辑器默认设置
    defaultIndentSize: state.defaultIndentSize,
    // 保存快捷键设置
    newTabShortcut: state.newTabShortcut,
    closeTabShortcut: state.closeTabShortcut,
  };

  storage.setItem("settings", data);
});
