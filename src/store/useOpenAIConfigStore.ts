import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";

import { storage } from "@/lib/indexedDBStore";

// OpenAI 客户端配置接口
export interface OpenAIConfig {
  apiKey: string;
  model: string;
  useProxy: boolean;
  proxyUrl: string;
  temperature: number;
}

export const AI_MODELS = [
  { value: "json-tools", label: "JSON Tools" },
  { value: "grok-2-1212", label: "Grok-2" },
  { value: "gpt-4o", label: "GPT-4o" },
];

const defaultOpenAIConfig: OpenAIConfig = {
  apiKey: "sk-BGoyyv5XIT0geSDjNvih31S89GxezQry9MbNs6MXW9axVKLz",
  model: "json-tools",
  useProxy: true,
  proxyUrl: "https://api.kl.do/v1",
  temperature: 0.7,
};

const BD_OPENAI_CONFIG_KEY = "openai-config";

interface OpenAIConfigStore extends OpenAIConfig {
  updateConfig: (config: Partial<OpenAIConfig>) => void;
  resetConfig: () => void;
  syncConfig: () => Promise<void>;
}

export const useOpenAIConfigStore = create<OpenAIConfigStore>()(
  subscribeWithSelector(
    devtools(
      (set) => ({
        ...defaultOpenAIConfig,
        updateConfig: (config) => set((state) => ({ ...state, ...config })),
        resetConfig: () => set(defaultOpenAIConfig),
        syncConfig: async () => {
          try {
            const savedConfig = await storage.getItem(BD_OPENAI_CONFIG_KEY);

            if (savedConfig) {
              set(savedConfig);
            }
          } catch (error) {
            console.error("Failed to sync OpenAI config:", error);
          }
        },
      }),
      {
        name: "OpenAIConfigStore",
        enabled: true,
      },
    ),
  ),
);

// 订阅 store 变化来持久化存储
useOpenAIConfigStore.subscribe(
  (state) => ({
    apiKey: state.apiKey,
    model: state.model,
    useProxy: state.useProxy,
    proxyUrl: state.proxyUrl,
    temperature: state.temperature,
  }),
  (config) => {
    storage.setItem(BD_OPENAI_CONFIG_KEY, config);
  },
);
