/**
 * 历史记录 Zustand Store
 * 管理历史记录的状态和操作
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { HistoryItem, HistoryStore, HistoryStats } from '@/types/history';
import { HistoryStorageManager } from '@/lib/historyStorage';
import { useTabStore } from './useTabStore';

export const useHistoryStore = create<HistoryStore>()(
  devtools(
    (set, get) => ({
      histories: [],
      isLoading: false,
      stats: {
        total: 0,
        monacoCount: 0,
        vanillaCount: 0,
      },

      /**
       * 加载所有历史记录
       */
      loadHistories: async () => {
        set({ isLoading: true });
        try {
          const histories = await HistoryStorageManager.getAllHistories();
          const stats = get().calculateStats(histories);
          set({ histories, stats, isLoading: false });
        } catch (error) {
          console.error('加载历史记录失败:', error);
          set({ isLoading: false });
        }
      },

      /**
       * 添加历史记录
       */
      addHistory: async (tab) => {
        try {
          // 生成历史记录唯一 key
          const historyKey = `history_${Date.now()}_${tab.key}`;

          // 确定编辑器类型
          const type = tab.vanilla ? 'vanilla' : 'monaco';

          const historyItem: HistoryItem = {
            key: historyKey,
            tabKey: tab.key,
            title: tab.title,
            content: tab.content,
            vanilla: tab.vanilla,
            editorSettings: tab.editorSettings,
            timestamp: Date.now(),
            type,
            createdAt: new Date().toISOString(),
          };

          // 保存到 IndexedDB
          await HistoryStorageManager.addHistory(historyItem);

          // 更新状态
          set((state) => {
            const newHistories = [historyItem, ...state.histories];
            const stats = get().calculateStats(newHistories);
            return { histories: newHistories, stats };
          });
        } catch (error) {
          console.error('添加历史记录失败:', error);
        }
      },

      /**
       * 删除历史记录
       */
      removeHistory: async (key) => {
        try {
          await HistoryStorageManager.removeHistory(key);
          set((state) => {
            const newHistories = state.histories.filter((h) => h.key !== key);
            const stats = get().calculateStats(newHistories);
            return { histories: newHistories, stats };
          });
        } catch (error) {
          console.error('删除历史记录失败:', error);
        }
      },

      /**
       * 清空所有历史记录
       */
      clearHistories: async () => {
        try {
          await HistoryStorageManager.clearHistories();
          set({
            histories: [],
            stats: {
              total: 0,
              monacoCount: 0,
              vanillaCount: 0,
            },
          });
        } catch (error) {
          console.error('清空历史记录失败:', error);
        }
      },

      /**
       * 恢复历史记录到新 Tab
       * 返回新创建的 tab 的 key
       */
      restoreHistory: async (historyKey) => {
        try {
          const history = get().getHistory(historyKey);
          if (!history) {
            console.error('历史记录不存在');
            return null;
          }

          // 创建新 Tab
          const tabStore = useTabStore.getState();

          // 获取当前 nextKey
          const currentNextKey = tabStore.nextKey;

          tabStore.addTab(history.title, history.content, {
            restoredFromHistory: true,
            historyKey,
          });

          // 使用 setTimeout 确保 addTab 的状态更新完成
          setTimeout(async () => {
            // 获取新创建的 tab（key 就是 currentNextKey）
            const newTab = tabStore.getTabByKey(`${currentNextKey}`);
            if (!newTab) {
              console.error('无法找到新创建的 tab');
              return;
            }

            // 如果是 vanilla 类型，恢复 vanilla 内容
            if (history.type === 'vanilla' && history.vanilla) {
              tabStore.setTabVanillaContent(newTab.key, history.vanilla);
            }

            // 确保切换到新创建的 tab
            tabStore.setActiveTab(newTab.key);

            // 再等一个 tick，确保 vanilla 内容更新完成
            setTimeout(async () => {
              // 立即同步到 IndexedDB，避免被后续的同步覆盖
              const { storage } = await import('@/lib/indexedDBStore');
              const DB_TABS = 'tabs';
              const DB_TAB_ACTIVE_KEY = 'tabs_active_key';
              const DB_TAB_NEXT_KEY = 'tabs_next_key';

              // 获取最新的状态
              const latestTabStore = useTabStore.getState();

              // 立即保存当前状态
              await storage.setItem(DB_TABS, latestTabStore.tabs);
              await storage.setItem(DB_TAB_ACTIVE_KEY, latestTabStore.activeTabKey);
              await storage.setItem(DB_TAB_NEXT_KEY, latestTabStore.nextKey);

              console.log('历史记录恢复并已同步到 IndexedDB');
            }, 0);
          }, 0);

          // 返回新 tab 的 key，供调用方使用
          return `${currentNextKey}`;
        } catch (error) {
          console.error('恢复历史记录失败:', error);
          return null;
        }
      },

      /**
       * 获取指定历史记录
       */
      getHistory: (key) => {
        return get().histories.find((h) => h.key === key);
      },

      /**
       * 搜索历史记录
       */
      searchHistories: (keyword) => {
        const { histories } = get();
        const lowerKeyword = keyword.toLowerCase();

        return histories.filter(
          (item) =>
            item.title.toLowerCase().includes(lowerKeyword) ||
            item.content.toLowerCase().includes(lowerKeyword),
        );
      },

      /**
       * 计算历史记录统计信息
       */
      calculateStats: (histories: HistoryItem[]): HistoryStats => {
        const monacoCount = histories.filter((h) => h.type === 'monaco').length;
        const vanillaCount = histories.filter((h) => h.type === 'vanilla').length;

        const timestamps = histories.map((h) => h.timestamp).sort((a, b) => a - b);

        return {
          total: histories.length,
          monacoCount,
          vanillaCount,
          oldestTimestamp: timestamps[0],
          newestTimestamp: timestamps[timestamps.length - 1],
        };
      },
    }),
    { name: 'historyStore' },
  ),
);
