/**
 * 历史记录相关类型定义
 */

import { Content } from 'vanilla-jsoneditor-cn';
import { TabItem } from '@/store/useTabStore';

/**
 * 历史记录项
 */
export interface HistoryItem {
  key: string; // 历史记录唯一 ID
  tabKey: string; // 原始 tab 的 key
  title: string; // 标题
  content: string; // Monaco 编辑器内容
  vanilla?: Content; // Vanilla 编辑器内容
  editorSettings: TabItem['editorSettings']; // 编辑器设置
  timestamp: number; // 时间戳
  type: 'monaco' | 'vanilla'; // 编辑器类型
  createdAt: string; // 创建时间（ISO 字符串）
}

/**
 * 历史记录统计信息
 */
export interface HistoryStats {
  total: number;
  monacoCount: number;
  vanillaCount: number;
  oldestTimestamp?: number;
  newestTimestamp?: number;
}

/**
 * 历史记录存储操作
 */
export interface HistoryStore {
  histories: HistoryItem[];
  isLoading: boolean;
  stats: HistoryStats;

  // 加载所有历史记录
  loadHistories: () => Promise<void>;

  // 添加历史记录
  addHistory: (tab: TabItem) => Promise<void>;

  // 删除历史记录
  removeHistory: (key: string) => Promise<void>;

  // 清空所有历史记录
  clearHistories: () => Promise<void>;

  // 恢复历史记录到新 Tab
  restoreHistory: (historyKey: string) => Promise<void>;

  // 获取指定历史记录
  getHistory: (key: string) => HistoryItem | undefined;

  // 搜索历史记录
  searchHistories: (keyword: string) => HistoryItem[];

  // 计算统计信息（内部方法）
  calculateStats: (histories: HistoryItem[]) => HistoryStats;
}
