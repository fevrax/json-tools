// useTabStore.ts
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { Content, JSONContent, Mode, TextContent } from "vanilla-jsoneditor-cn";

import { useSettingsStore } from "./useSettingsStore";

import { storage } from "@/lib/indexedDBStore";

export interface TabItem {
  key: string;
  title: string;
  content: string;
  diffModifiedValue?: string; // diff 右边比较值
  monacoVersion: number; // 乐观锁
  vanilla?: Content;
  vanillaVersion: number;
  vanillaMode: Mode;
  closable?: boolean;
  editorSettings: {
    fontSize: number;
    language: string;
  };
}

interface TabStore {
  tabs: TabItem[];
  activeTabKey: string;
  nextKey: number;
  activeTab: () => TabItem;
  getTabByKey: (key: string) => TabItem | undefined;
  initTab: () => void;
  addTab: (title: string | undefined, content: string | undefined) => void;
  addTabSimple: () => void;
  setTabContent: (key: string, content: string) => void;
  setTabModifiedValue: (key: string, content: string) => void;
  setTabVanillaContent: (key: string, content: Content) => void;
  setTabVanillaMode: (key: string, mode: Mode) => void;
  setMonacoVersion: (key: string, version: number) => void;
  setVanillaVersion: (key: string, version: number) => void;
  syncTabStore: () => Promise<void>;
  closeTab: (keyToRemove: string) => void;
  setActiveTab: (key: string) => void;
  renameTab: (key: string, newTitle: string) => void;
  closeOtherTabs: (currentKey: string) => Array<string>;
  closeLeftTabs: (currentKey: string) => Array<string>;
  closeRightTabs: (currentKey: string) => Array<string>;
  closeAllTabs: () => Array<string>;
  vanilla2JsonContent: (key: string) => void;
  jsonContent2VanillaContent: (key: string) => void;
  updateEditorSettings: (key: string, settings: TabItem["editorSettings"]) => void;
}

export const useTabStore = create<TabStore>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        tabs: [],
        activeTabKey: "2",
        nextKey: 2,
        activeTab: () => {
          const activeTab = get().tabs.find(
            (tab) => tab.key === get().activeTabKey,
          );

          return activeTab || get().tabs[0];
        },
        getTabByKey: (key: string) => get().tabs.find((tab) => tab.key === key),
        addTab: (title: string | undefined, content: string | undefined) =>
          set((state) => {
            const newTabKey = `${state.nextKey}`;
            const newTab: TabItem = {
              key: `${state.nextKey}`,
              title: `New Tab ${title ? title : newTabKey}`,
              content: content ? content : ``,
              vanillaMode: Mode.tree,
              closable: true,
              vanillaVersion: 0,
              monacoVersion: 0,
              editorSettings: {
                fontSize: 14,
                language: "json",
              },
            };

            return {
              tabs: [...state.tabs, newTab],
              activeTabKey: newTabKey,
              nextKey: state.nextKey + 1,
            };
          }),
        initTab: () => {
          set((state) => {
            const tabs = [
              {
                key: "1",
                title: "New Tab 1",
                content: ``,
                closable: true,
                vanillaMode: Mode.text,
                vanillaVersion: 0,
                monacoVersion: 0,
                editorSettings: {
                  fontSize: 14,
                  language: "json",
                },
              },
            ];

            return {
              ...state,
              tabs,
            };
          });
        },
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
              monacoVersion: 1,
              vanillaVersion: 0,
              editorSettings: {
                fontSize: 14,
                language: "json",
              },
            };

            return {
              tabs: [...state.tabs, newTab],
              activeTabKey: newTabKey,
              nextKey: state.nextKey + 1,
            };
          }),
        setMonacoVersion: (key: string, version: number) =>
          set((state) => {
            const updatedTabs = state.tabs.map((tab) =>
              tab.key === key
                ? {
                    ...tab,
                    monacoVersion: version,
                  }
                : tab,
            );

            return { tabs: updatedTabs };
          }),
        setVanillaVersion: (key: string, version: number) =>
          set((state) => {
            const updatedTabs = state.tabs.map((tab) =>
              tab.key === key
                ? {
                    ...tab,
                    vanillaVersion: version,
                  }
                : tab,
            );

            return { tabs: updatedTabs };
          }),
        setTabContent: (key, content) =>
          set((state) => {
            const updatedTabs = state.tabs.map((tab) =>
              tab.key === key
                ? { ...tab, content, monacoVersion: ++tab.monacoVersion }
                : tab,
            );

            return { tabs: updatedTabs };
          }),
        setTabModifiedValue: (key, content) =>
          set((state) => {
            const updatedTabs = state.tabs.map((tab) =>
              tab.key === key
                ? {
                    ...tab,
                    diffModifiedValue: content,
                    monacoVersion: ++tab.monacoVersion,
                  }
                : tab,
            );

            return { tabs: updatedTabs };
          }),
        setTabVanillaContent: (key: string, content: Content) =>
          set((state) => {
            const updatedTabs = state.tabs.map((tab) =>
              tab.key === key
                ? {
                    ...tab,
                    vanilla: content,
                    vanillaVersion: ++tab.vanillaVersion,
                  }
                : tab,
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
        syncTabStore: async () => {
          const tabs = await storage.getItem<TabItem[]>(DB_TABS);
          const activeTabKey = await storage.getItem<string>(DB_TAB_ACTIVE_KEY);
          const nextKey = await storage.getItem<number>(DB_TAB_NEXT_KEY);
          const data: Record<string, any> = {};

          if (tabs) {
            data.tabs = tabs;
          } else {
            get().initTab();
          }
          if (activeTabKey) {
            data.activeTabKey = activeTabKey;
          }
          if (nextKey) {
            data.nextKey = nextKey;
          }
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
        closeOtherTabs: (currentKey): Array<string> => {
          const currentTab = get().tabs.find((tab) => tab.key === currentKey);
          // 将被关闭的key 保存
          const closedKeys = get()
            .tabs.filter((tab) => tab.key !== currentKey)
            .map((tab) => tab.key);

          console.log("closedKeys", closedKeys);

          set(() => {
            return {
              tabs: currentTab ? [currentTab] : [],
              activeTabKey: currentKey,
            };
          });

          return closedKeys;
        },

        // 关闭左侧标签页
        closeLeftTabs: (currentKey): Array<string> => {
          const tabs = get().tabs;
          const currentIndex = tabs.findIndex((tab) => tab.key === currentKey);
          // 将被关闭的key 保存
          const closedKeys = tabs.slice(0, currentIndex).map((tab) => tab.key);
          const updatedTabs = tabs.slice(currentIndex);

          set(() => {
            return {
              tabs: updatedTabs,
              activeTabKey: currentKey,
            };
          });

          return closedKeys;
        },

        // 关闭右侧标签页
        closeRightTabs: (currentKey): Array<string> => {
          const tabs = get().tabs;
          const currentIndex = tabs.findIndex((tab) => tab.key === currentKey);
          // 将被关闭的key 保存
          const closedKeys = tabs.slice(currentIndex + 1).map((tab) => tab.key);

          const updatedTabs = tabs.slice(0, currentIndex + 1);

          set(() => {
            return {
              tabs: updatedTabs,
              activeTabKey: currentKey,
            };
          });

          return closedKeys;
        },
        // 关闭所有标签页，默认保留第一个标签页
        closeAllTabs: (): Array<string> => {
          // 将被关闭的key 保存, 保留key = 1 的标签页
          const closedKeys = get()
            .tabs.filter((tab) => tab.key !== "1")
            .map((tab) => tab.key);

          set(() => {
            const defaultTab = [
              {
                key: "1",
                title: "New Tab 1",
                content: "",
                vanillaMode: Mode.tree,
                closable: true,
                monacoVersion: 0,
                vanillaVersion: 0,
                editorSettings: {
                  fontSize: 14,
                  language: "json",
                },
              },
            ];

            return {
              tabs: defaultTab,
              activeTabKey: "1",
              nextKey: 2,
            };
          });

          return closedKeys;
        },
        vanilla2JsonContent: (key: string) =>
          set((state) => {
            const activeTab = get().getTabByKey(key);

            // 处理空值情况
            if (!activeTab || !activeTab.vanilla) {
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
        jsonContent2VanillaContent: (key: string) =>
          set((state) => {
            const activeTab = get().getTabByKey(key);

            // 处理空内容情况
            if (!activeTab) {
              return state;
            }

            try {
              // 尝试解析 JSON
              const parsedJson = JSON.parse(activeTab.content);

              activeTab.vanilla = { json: parsedJson };
              activeTab.vanillaMode = Mode.tree;

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
        updateEditorSettings: (key: string, settings: TabItem["editorSettings"]) =>
          set((state) => {
            const updatedTabs = state.tabs.map((tab) =>
              tab.key === key
                ? {
                    ...tab,
                    editorSettings: {
                      ...tab.editorSettings,
                      ...settings,
                    },
                  }
                : tab,
            );

            return { tabs: updatedTabs };
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
const timeout = 2000;

useTabStore.subscribe(
  (state) => state.tabs,
  (tabs) => {
    if (useSettingsStore.getState().editDataSaveLocal) {
      clearTimeout(tabsSaveTimeout);
      tabsSaveTimeout = setTimeout(() => {
        storage.setItem(DB_TABS, tabs);
      }, timeout);
    }
  },
);

useTabStore.subscribe(
  (state) => [state.activeTabKey, state.nextKey],
  (arr) => {
    if (useSettingsStore.getState().editDataSaveLocal) {
      clearTimeout(tabActiveSaveTimeout);
      tabActiveSaveTimeout = setTimeout(() => {
        storage.setItem(DB_TAB_ACTIVE_KEY, arr[0]);
        storage.setItem(DB_TAB_NEXT_KEY, arr[1]);
      }, timeout);
    }
  },
);
