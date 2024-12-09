// useSidebarStore.ts
import type { SidebarItem } from "@/components/sidebar/sidebar";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

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
  activeKey: string; // 当前激活的key
  clickSwitchKey: string; // 点击切换的key 需要执行switchActiveKey切换操作
  updateActiveKey: (key: string) => void;
  updateClickSwitchKey: (key: string) => void;
  switchActiveKey: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
  devtools(
    (set) => ({
      activeKey: SidebarKeys.textView,
      clickSwitchKey: SidebarKeys.textView,
      updateActiveKey: (key) => set({ activeKey: key }),
      updateClickSwitchKey: (key) => set({ clickSwitchKey: key }),
      switchActiveKey: () =>
        set((state) => ({ activeKey: state.clickSwitchKey })),
    }),
    {
      name: "SidebarStore", // 可选：为devtools指定一个名称
      enabled: true,
    },
  ),
);
