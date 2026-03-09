/**
 * 历史记录存储管理器
 * 使用新的存储管理器存储历史记录，性能优化版本
 */

import { StorageManager } from "./storage/StorageManager";

import { HistoryItem } from "@/types/history";

const storageManager = new StorageManager();
const MAX_HISTORIES = 200; // 最大历史记录数量

/**
 * 历史记录存储管理类
 */
export class HistoryStorageManager {
  /**
   * 获取所有历史记录
   */
  static async getAllHistories(): Promise<HistoryItem[]> {
    try {
      const keys = await storageManager.keys();
      const historyKeys = keys.filter((key) => key.startsWith("history_"));
      const items: HistoryItem[] = [];

      for (const key of historyKeys) {
        const item = await storageManager.get<HistoryItem>(key);

        if (item) {
          items.push(item);
        }
      }

      // 按时间戳降序排序（最新的在前）
      return items.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("获取历史记录失败:", error);

      return [];
    }
  }

  /**
   * 添加历史记录
   * 自动维护最大记录数限制
   */
  static async addHistory(history: HistoryItem): Promise<void> {
    try {
      // 保存新记录（立即保存，确保不丢失）
      await storageManager.set(history.key, history, { immediate: true });

      // 检查并清理旧记录
      await this.cleanupOldHistories();
    } catch (error) {
      console.error("添加历史记录失败:", error);
      // 重试一次
      try {
        await storageManager.set(history.key, history, {
          immediate: true,
          retryCount: 3,
        });
      } catch (retryError) {
        console.error("重试添加历史记录失败:", retryError);
      }
    }
  }

  /**
   * 清理旧的历史记录，保持最大数量限制
   */
  private static async cleanupOldHistories(): Promise<void> {
    try {
      const keys = await storageManager.keys();
      const historyKeys = keys.filter((key) => key.startsWith("history_"));

      if (historyKeys.length > MAX_HISTORIES) {
        // 按时间戳排序，删除最旧的记录
        const items: Array<{ key: string; timestamp: number }> = [];

        for (const key of historyKeys) {
          const item = await storageManager.get<HistoryItem>(key);

          if (item) {
            items.push({ key: item.key, timestamp: item.timestamp });
          }
        }

        // 按时间戳升序排序（最旧的在前）
        items.sort((a, b) => a.timestamp - b.timestamp);

        // 删除超出数量的旧记录
        const toDelete = items.slice(0, items.length - MAX_HISTORIES);

        for (const item of toDelete) {
          await storageManager.remove(item.key);
        }

        console.log(`清理了 ${toDelete.length} 条历史记录`);
      }
    } catch (error) {
      console.error("清理历史记录失败:", error);
    }
  }

  /**
   * 删除指定历史记录
   */
  static async removeHistory(key: string): Promise<void> {
    try {
      await storageManager.remove(key);
    } catch (error) {
      console.error("删除历史记录失败:", error);
    }
  }

  /**
   * 清空所有历史记录
   */
  static async clearHistories(): Promise<void> {
    try {
      const keys = await storageManager.keys();
      const historyKeys = keys.filter((key) => key.startsWith("history_"));

      for (const key of historyKeys) {
        await storageManager.remove(key);
      }

      console.log("已清空所有历史记录");
    } catch (error) {
      console.error("清空历史记录失败:", error);
    }
  }

  /**
   * 获取指定历史记录
   */
  static async getHistory(key: string): Promise<HistoryItem | null> {
    try {
      const item = await storageManager.get<HistoryItem>(key);

      return item;
    } catch (error) {
      console.error("获取历史记录失败:", error);

      return null;
    }
  }

  /**
   * 搜索历史记录
   */
  static async searchHistories(keyword: string): Promise<HistoryItem[]> {
    try {
      const allHistories = await this.getAllHistories();
      const lowerKeyword = keyword.toLowerCase();

      return allHistories.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerKeyword) ||
          item.content.toLowerCase().includes(lowerKeyword),
      );
    } catch (error) {
      console.error("搜索历史记录失败:", error);

      return [];
    }
  }

  /**
   * 获取历史记录数量
   */
  static async getCount(): Promise<number> {
    try {
      const keys = await storageManager.keys();

      return keys.filter((key) => key.startsWith("history_")).length;
    } catch (error) {
      console.error("获取历史记录数量失败:", error);

      return 0;
    }
  }
}
