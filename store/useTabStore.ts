// useTabStore.ts
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { Content, JSONContent, Mode, TextContent } from "vanilla-jsoneditor-cn";

import { storage } from "@/lib/indexedDBStore";

export interface TabItem {
  key: string;
  title: string;
  content: string;
  vanilla?: Content;
  vanillaMode: Mode;
  closable?: boolean;
}

interface TabStore {
  tabs: TabItem[];
  activeTabKey: string;
  nextKey: number;
  activeTab: () => TabItem;
  getTabByKey: (key: string) => TabItem | undefined;
  addTab: () => void;
  addTabSimple: () => void;
  setTabContent: (key: string, content: string) => void;
  setTabVanillaContent: (key: string, content: Content) => void;
  setTabVanillaMode: (key: string, mode: Mode) => void;
  syncStore: () => Promise<void>;
  closeTab: (keyToRemove: string) => void;
  setActiveTab: (key: string) => void;
  renameTab: (key: string, newTitle: string) => void;
  closeOtherTabs: (currentKey: string) => void;
  closeLeftTabs: (currentKey: string) => void;
  closeRightTabs: (currentKey: string) => void;
  vanilla2JsonContent: () => void;
  jsonContent2VanillaContent: () => void;
  closeAllTabs: () => void;
}

export const useTabStore = create<TabStore>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        tabs: [
          {
            key: "1",
            title: "New Tab 1",
            content: `{"name": "Tab 1"}`,
            closable: true,
          },
        ],
        activeTabKey: "2",
        nextKey: 2,
        activeTab: () => {
          const activeTab = get().tabs.find(
            (tab) => tab.key === get().activeTabKey,
          );

          return activeTab || get().tabs[0];
        },
        getTabByKey: (key: string) => get().tabs.find((tab) => tab.key === key),
        addTab: () =>
          set((state) => {
            const newTabKey = `${state.nextKey}`;
            const newTab: TabItem = {
              key: `${state.nextKey}`,
              title: `New Tab ${newTabKey}`,
              content: ``,
              vanillaMode: Mode.tree,
              closable: true,
            };

            return {
              tabs: [...state.tabs, newTab],
              activeTabKey: newTabKey,
              nextKey: state.nextKey + 1,
            };
          }),
        addTabSimple: () =>
          set((state) => {
            const newTabKey = `${state.nextKey}`;
            const newTab: TabItem = {
              key: `${state.nextKey}`,
              title: `Simple Tab ${newTabKey}`,
              content: `{
    "data": {
        "name": "Simple Tab ${newTabKey}"
    },
    "list": [
        {
            "id": "1212092628029698048",
            "possibly_sensitive": false,
            "author_id": "2244994945",
            "lang": "en",
            "created_at": "2019-12-31T19:26:16.000Z",
            "source": "Twitter Web App",
            "in_reply_to_user_id": "2244994945",
            "attachments": {
                "media_keys": [
                    "16_1211797899316740096"
                ]
            }
        }
    ]
}`,
              vanillaMode: Mode.tree,
              closable: true,
            };

            return {
              tabs: [...state.tabs, newTab],
              activeTabKey: newTabKey,
              nextKey: state.nextKey + 1,
            };
          }),
        setTabContent: (key, content) =>
          set((state) => {
            const updatedTabs = state.tabs.map((tab) =>
              tab.key === key ? { ...tab, content } : tab,
            );

            return { tabs: updatedTabs };
          }),
        setTabVanillaContent: (key: string, content: Content) =>
          set((state) => {
            const updatedTabs = state.tabs.map((tab) =>
              tab.key === key ? { ...tab, vanilla: content } : tab,
            );

            return { tabs: updatedTabs };
          }),
        setTabVanillaMode: (key: string, mode: Mode) =>
          set((state) => {
            const updatedTabs = state.tabs.map((tab) =>
              tab.key === key ? { ...tab, vanillaMode: mode } : tab,
            );

            return { tabs: updatedTabs };
          }),
        // 从 IndexedDB 同步数据
        syncStore: async () => {
          const tabs = await storage.getItem<TabItem[]>(DB_TABS);
          const activeTabKey = await storage.getItem<string>(DB_TAB_ACTIVE_KEY);
          const nextKey = await storage.getItem<number>(DB_TAB_NEXT_KEY);
          const data: Record<string, any> = {};

          if (tabs) {
            data.tabs = tabs;
          }
          if (activeTabKey) {
            data.activeTabKey = activeTabKey;
          }
          if (nextKey) {
            data.nextKey = nextKey;
          }
          console.log("syncStore", tabs, activeTabKey, nextKey);
          set({
            ...data,
          });
        },
        renameTab: (key: string, newTitle: string) =>
          set((state) => {
            // 不允许重命名为空
            if (!newTitle.trim()) return state;

            const updatedTabs = state.tabs.map((tab) =>
              tab.key === key ? { ...tab, title: newTitle.trim() } : tab,
            );

            return { tabs: updatedTabs };
          }),
        closeTab: (keyToRemove) => {
          if (get().tabs.length === 1) {
            get().closeAllTabs();

            return;
          }

          set((state) => {
            const tabIndex = state.tabs.findIndex(
              (tab) => tab.key === keyToRemove,
            );

            const updatedTabs = state.tabs.filter(
              (tab) => tab.key !== keyToRemove,
            );

            let newActiveTab = state.activeTabKey;

            if (keyToRemove === state.activeTabKey && state.tabs.length > 1) {
              if (tabIndex - 1 < 0) {
                newActiveTab = state.tabs[tabIndex + 1].key;
              } else {
                newActiveTab = state.tabs[tabIndex - 1].key;
              }
            }

            return { tabs: updatedTabs, activeTabKey: newActiveTab };
          });
        },
        setActiveTab: (key) => set({ activeTabKey: key }),
        // 关闭其他标签页
        closeOtherTabs: (currentKey) =>
          set((state) => {
            const currentTab = state.tabs.find((tab) => tab.key === currentKey);

            return {
              tabs: currentTab ? [currentTab] : [],
              activeTabKey: currentKey,
            };
          }),

        // 关闭左侧标签页
        closeLeftTabs: (currentKey) =>
          set((state) => {
            const currentIndex = state.tabs.findIndex(
              (tab) => tab.key === currentKey,
            );
            const updatedTabs = state.tabs.slice(currentIndex);

            return {
              tabs: updatedTabs,
              activeTabKey: currentKey,
            };
          }),

        // 关闭右侧标签页
        closeRightTabs: (currentKey) =>
          set((state) => {
            const currentIndex = state.tabs.findIndex(
              (tab) => tab.key === currentKey,
            );
            const updatedTabs = state.tabs.slice(0, currentIndex + 1);

            return {
              tabs: updatedTabs,
              activeTabKey: currentKey,
            };
          }),
        // 关闭所有标签页，默认保留第一个标签页
        closeAllTabs: () =>
          set(() => {
            const defaultTab = [
              {
                key: "1",
                title: "New Tab 1",
                content: "",
                vanillaMode: Mode.tree,
                closable: true,
              },
            ];

            return {
              tabs: defaultTab,
              activeTabKey: "1",
              nextKey: 2,
            };
          }),
        vanilla2JsonContent: () =>
          set((state) => {
            const activeTab = get().activeTab();

            // 处理空值情况
            if (!activeTab.vanilla) {
              return state;
            }

            const vanilla = activeTab.vanilla;

            // 类型守卫
            const isJSONContent = (content: any): content is JSONContent => {
              return "json" in content;
            };

            const isTextContent = (content: any): content is TextContent => {
              return "text" in content;
            };

            try {
              if (isJSONContent(vanilla)) {
                activeTab.content = JSON.stringify(vanilla.json, null, 2);

                // 处理JSON内容
                return {
                  ...state,
                  tabs: state.tabs.map((tab) =>
                    tab.key === activeTab.key ? activeTab : tab,
                  ),
                };
              } else if (isTextContent(vanilla)) {
                activeTab.content = vanilla.text;

                // 处理文本内容
                return {
                  ...state,
                  tabs: state.tabs.map((tab) =>
                    tab.key === activeTab.key ? activeTab : tab,
                  ),
                };
              }

              // 处理未知类型
              console.error("Unknown content type:", vanilla);

              return { ...state, content: "" };
            } catch (error) {
              // 错误处理
              console.error("Error converting content:", error);

              return state;
            }
          }),
        jsonContent2VanillaContent: () =>
          set((state) => {
            const activeTab = get().activeTab();

            // 处理空内容情况
            if (!activeTab.content) {
              return state;
            }

            try {
              // 尝试解析 JSON
              const parsedJson = JSON.parse(activeTab.content);

              activeTab.vanilla = { json: parsedJson };

              return {
                ...state,
                tabs: state.tabs.map((tab) =>
                  tab.key === activeTab.key ? activeTab : tab,
                ),
              };
            } catch (error) {
              // 解析失败的错误处理
              console.log("jsonContent2VanillaContent 解析失败", error);

              // 可以根据需要返回原状态或者特定的错误状态
              activeTab.vanilla = { text: activeTab.content };
              activeTab.vanillaMode = Mode.text;

              return {
                ...state,
                tabs: state.tabs.map((tab) =>
                  tab.key === activeTab.key ? activeTab : tab,
                ),
              };
            }
          }),
      }),
      { name: "tabStore", enabled: true },
    ),
  ),
);

const DB_TABS = "tabs";
const DB_TAB_ACTIVE_KEY = "tabs_active_key";
const DB_TAB_NEXT_KEY = "tabs_next_key";

// useTabStore.subscribe((state) => {
//   storage.setItem(DB_TABS, state.tabs);
//   storage.setItem(DB_TAB_ACTIVE_KEY, state.activeTabKey);
//   storage.setItem(DB_TAB_NEXT_KEY, state.nextKey);
// });

let tabsSaveTimeout: NodeJS.Timeout;
let tabActiveSaveTimeout: NodeJS.Timeout;
const timeout = 4000;

useTabStore.subscribe(
  (state) => state.tabs,
  (tabs) => {
    clearTimeout(tabsSaveTimeout);
    // 5 秒后保存
    tabsSaveTimeout = setTimeout(() => {
      storage.setItem(DB_TABS, tabs);
    }, 4000);
  },
);

useTabStore.subscribe(
  (state) => [state.activeTabKey, state.nextKey],
  (arr) => {
    clearTimeout(tabActiveSaveTimeout);
    console.log("useTabStore.subscribe", arr);
    // 5 秒后保存
    tabActiveSaveTimeout = setTimeout(() => {
      storage.setItem(DB_TAB_ACTIVE_KEY, arr[0]);
      storage.setItem(DB_TAB_NEXT_KEY, arr[1]);
    }, timeout);
  }
);
