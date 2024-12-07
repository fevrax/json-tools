// useTabStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface TabItem {
  key: string;
  title: string;
  content: string;
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
  closeTab: (keyToRemove: string) => void;
  setActiveTab: (key: string) => void;
  renameTab: (key: string, newTitle: string) => void;
  closeOtherTabs: (currentKey: string) => void;
  closeLeftTabs: (currentKey: string) => void;
  closeRightTabs: (currentKey: string) => void;
  closeAllTabs: () => void;
}

export const useTabStore = create<TabStore>()(
  devtools(
    (set, get) => ({
      tabs: [
        { key: "1", title: "New Tab 1", content: "New Tab 1", closable: true },
        {
          key: "2",
          title: "New Tab 2",
          content: "New Tab 2",
          closable: true,
        },
        { key: "3", title: "New Tab 3", content: "New Tab 1", closable: true },
      ],
      activeTabKey: "2",
      // nextKey: 2,
      nextKey: 4,
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
            { key: "1", title: "New Tab 1", content: "", closable: true },
          ];

          return {
            tabs: defaultTab,
            activeTabKey: "1",
            nextKey: 2,
          };
        }),
    }),
    { name: "tabStore", enabled: true },
  ),
);
