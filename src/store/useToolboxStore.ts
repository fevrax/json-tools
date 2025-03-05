// src/stores/toolboxStore.ts
import { create } from "zustand";

export interface Tool {
  id: string;
  name: string;
  icon: string;
  description: string;
  path: string;
  category: string[];
}

interface ToolboxState {
  tools: Tool[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredTools: () => Tool[];
}

const demoTools: Tool[] = [
  {
    id: "jsonAIRepair",
    name: "JSON AI 修复工具",
    icon: "solar:magic-stick-bold",
    description: "AI 智能识别并修复JSON格式错误，让您的JSON数据恢复正常",
    path: "/toolbox/jsonAIRepair",
    category: ["AI", "数据处理"],
  },
  {
    id: "jsonToObject",
    name: "JSON转换对象",
    icon: "solar:code-square-bold",
    description: "将JSON数据快速转换为TypeScript或JavaScript对象",
    path: "/toolbox/jsonToObject",
    category: ["数据处理"],
  },
];

export const useToolboxStore = create<ToolboxState>((set, get) => ({
  tools: demoTools,
  searchQuery: "",
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  filteredTools: () => {
    const { tools, searchQuery } = get();

    if (!searchQuery.trim()) return tools;

    const query = searchQuery.toLowerCase();

    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        (tool.category &&
          tool.category.some((cat) => cat.toLowerCase().includes(query))),
    );
  },
}));
