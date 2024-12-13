// useSidebarStore.ts
import type { SidebarItem } from "@/components/sidebar/sidebar";

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";

import { storage } from "@/lib/indexedDBStore";
import { useSettingsStore } from "@/store/useSettingsStore";

export enum SidebarKeys {
  textView = "textView",
  treeView = "treeView",
  diffView = "diffView",
}

export const items: SidebarItem[] = [
  {
    key: SidebarKeys.textView,
    icon: "solar:home-2-linear",
    title: "文本视图",
  },
  {
    key: SidebarKeys.treeView,
    icon: "solar:widget-2-outline",
    title: "树形视图",
  },
  {
    key: SidebarKeys.diffView,
    icon: "solar:checklist-minimalistic-outline",
    title: "DIFF视图",
  },
];

interface SidebarStore {
  activeKey: SidebarKeys;
  clickSwitchKey: SidebarKeys;
  updateActiveKey: (key: SidebarKeys) => void;
  updateClickSwitchKey: (key: SidebarKeys) => void;
  syncSidebarStore: () => Promise<void>;
  switchActiveKey: () => void;
}

const BD_SIDEBAR_ACTIVE_KEY = "sidebar";

export const useSidebarStore = create<SidebarStore>()(
  subscribeWithSelector(
    devtools(
      (set) => ({
        activeKey: SidebarKeys.textView,
        clickSwitchKey: SidebarKeys.textView,
        updateActiveKey: (key) => set({ activeKey: key }),
        updateClickSwitchKey: (key) => set({ clickSwitchKey: key }),
        switchActiveKey: () =>
          set((state) => ({ activeKey: state.clickSwitchKey })),
        syncSidebarStore: async () => {
          const activeKey = await storage.getItem(BD_SIDEBAR_ACTIVE_KEY);
          const data: Record<string, any> = {};

          if (activeKey) {
            data.activeKey = activeKey;
            data.clickSwitchKey = activeKey;
          }
          set(data);
        },
      }),
      {
        name: "SidebarStore",
        enabled: true,
      },
    ),
  ),
);

// 只监听 activeKey 的变化
useSidebarStore.subscribe(
  (state) => state.activeKey,
  (activeKey) => {
    if (useSettingsStore.getState().editDataSaveLocal) {
      storage.setItem(BD_SIDEBAR_ACTIVE_KEY, activeKey);
    }
  },
);
