// useTabStore.ts
import { create } from "zustand";

export interface TabItem {
  key: string;
  title: string;
  content: string;
  closable?: boolean;
}

interface TabStore {
  tabs: TabItem[];
  activeTab: string;
  addTab: () => void;
  closeTab: (keyToRemove: string) => void;
  setActiveTab: (key: string) => void;
}

export const useTabStore = create<TabStore>((set) => ({
  tabs: [{ key: "1", title: "New Tab 1", content: "首页内容", closable: true }],
  activeTab: "1",
  addTab: () =>
    set((state) => {
      const newTabKey = (state.tabs.length + 1).toString();
      const newTab: TabItem = {
        key: newTabKey,
        title: `New Tab ${newTabKey}`,
        content: `New Tab ${newTabKey} 的内容`,
        closable: true,
      };

      return { tabs: [...state.tabs, newTab], activeTab: newTabKey };
    }),
  closeTab: (keyToRemove) =>
    set((state) => {
      const updatedTabs = state.tabs.filter((tab) => tab.key !== keyToRemove);
      const newActiveTab =
        keyToRemove === state.activeTab
          ? updatedTabs[updatedTabs.length - 1]?.key || "1"
          : state.activeTab;

      return { tabs: updatedTabs, activeTab: newActiveTab };
    }),
  setActiveTab: (key) => set({ activeTab: key }),
}));
