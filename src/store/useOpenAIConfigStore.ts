import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";

import { storage } from "@/lib/indexedDBStore";

// 检查 utools 是否可用
const isUtoolsAvailable = typeof window !== "undefined" && "utools" in window;

// AI 路由类型
export type AIRouteType = "default" | "utools" | "custom";

// 默认线路配置
interface DefaultRouteConfig {
  model: string;
  temperature: number;
}

// Utools线路配置
interface UtoolsRouteConfig {
  model: string;
  temperature: number;
}

// 自定义线路配置
interface CustomRouteConfig {
  apiKey: string;
  model: string;
  proxyUrl: string;
  temperature: number;
}

// OpenAI 客户端配置接口
export interface OpenAIConfig {
  routeType: AIRouteType;
  defaultRoute: DefaultRouteConfig;
  utoolsRoute: UtoolsRouteConfig;
  customRoute: CustomRouteConfig;
  utoolsModels: Array<{ value: string; label: string }>;
}

export const AI_MODELS = [
  { value: "json-tools", label: "JSON Tools" },
  { value: "grok-2-1212", label: "Grok-2" },
  { value: "gpt-4o", label: "GPT-4o" },
];

const defaultOpenAIConfig: OpenAIConfig = {
  routeType: "default",
  defaultRoute: {
    model: "json-tools",
    temperature: 0.7,
  },
  utoolsRoute: {
    model: "deepseek-v3",  // 使用默认模型
    temperature: 0.7,
  },
  customRoute: {
    apiKey: "",
    model: "gpt-4-turbo",
    proxyUrl: "https://api.openai.com/v1",
    temperature: 0.7,
  },
  utoolsModels: [],
};

// 默认线路的固定 API Key
export const DEFAULT_ROUTE_API_KEY =
  "sk-BGoyyv5XIT0geSDjNvih31S89GxezQry9MbNs6MXW9axVKLz";
export const DEFAULT_ROUTE_PROXY_URL = "https://api.ssooai.com/v1";

const BD_OPENAI_CONFIG_KEY = "openai-config";

interface OpenAIConfigStore extends OpenAIConfig {
  updateConfig: (config: Partial<OpenAIConfig>) => void;
  updateDefaultRouteConfig: (config: Partial<DefaultRouteConfig>) => void;
  updateUtoolsRouteConfig: (config: Partial<UtoolsRouteConfig>) => void;
  updateCustomRouteConfig: (config: Partial<CustomRouteConfig>) => void;
  resetConfig: () => void;
  syncConfig: () => Promise<void>;
  fetchUtoolsModels: () => Promise<void>;

  // 获取当前线路的配置
  getCurrentRouteConfig: () =>
    | DefaultRouteConfig
    | UtoolsRouteConfig
    | CustomRouteConfig;

  // 获取当前线路的有效 API Key
  getCurrentApiKey: () => string;

  // 获取当前线路的有效 API 地址
  getCurrentProxyUrl: () => string;

  // 获取当前线路的有效模型
  getCurrentModel: () => string;
}

export const useOpenAIConfigStore = create<OpenAIConfigStore>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        ...defaultOpenAIConfig,

        updateConfig: (config) => set((state) => ({ ...state, ...config })),

        updateDefaultRouteConfig: (config) =>
          set((state) => ({
            ...state,
            defaultRoute: { ...state.defaultRoute, ...config },
          })),

        updateUtoolsRouteConfig: (config) =>
          set((state) => ({
            ...state,
            utoolsRoute: { ...state.utoolsRoute, ...config },
          })),

        updateCustomRouteConfig: (config) =>
          set((state) => ({
            ...state,
            customRoute: { ...state.customRoute, ...config },
          })),

        resetConfig: () => set(defaultOpenAIConfig),

        syncConfig: async () => {
          try {
            const savedConfig = await storage.getItem(BD_OPENAI_CONFIG_KEY);

            if (savedConfig) {
              // 确保只更新有效字段，而不是完全覆盖
              set((state) => ({
                ...state,
                ...(savedConfig as Partial<OpenAIConfig>),
              }));
            }
          } catch (error) {
            console.error("Failed to sync OpenAI config:", error);
          }
        },

        fetchUtoolsModels: async () => {
          try {
            // 检查 uTools 是否可用
            if (!isUtoolsAvailable) {
              console.error("uTools is not available");
              return;
            }

            // 使用 utools.allAiModels API 获取模型列表
            const models = await (window as any).utools.allAiModels();
            
            if (Array.isArray(models) && models.length > 0) {
              // 将 utools 模型数据转换为应用需要的格式
              const formattedModels = models.map(model => ({
                value: model.id,
                label: `${model.label}${model.cost > 0 ? ` (${model.cost}积分)` : ''}`,
              }));
              
              set((state) => ({ ...state, utoolsModels: formattedModels }));
              
              // 如果当前没有选择模型或选择的模型不在列表中，自动选择第一个模型
              const currentModel = get().utoolsRoute.model;
              if (!currentModel || !formattedModels.find(m => m.value === currentModel)) {
                const defaultModel = formattedModels[0]?.value || "deepseek-v3";
                get().updateUtoolsRouteConfig({ model: defaultModel });
              }
            } else {
              // 如果无法获取模型列表，使用备用模型列表
              const fallbackModels = [
                { value: "deepseek-v3", label: "DeepSeek-V3" },
                { value: "gpt-4o", label: "GPT-4o" },
                { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
              ];
              
              set((state) => ({ ...state, utoolsModels: fallbackModels }));
            }
          } catch (error) {
            console.error("Failed to fetch Utools models:", error);
            
            // 出错时使用备用模型列表
            const fallbackModels = [
              { value: "deepseek-v3", label: "DeepSeek-V3" },
              { value: "gpt-4o", label: "GPT-4o" },
              { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
            ];
            
            set((state) => ({ ...state, utoolsModels: fallbackModels }));
          }
        },

        // 获取当前线路的配置
        getCurrentRouteConfig: () => {
          const state = get();
          switch (state.routeType) {
            case "default":
              return state.defaultRoute;
            case "utools":
              return state.utoolsRoute;
            case "custom":
              return state.customRoute;
            default:
              return state.defaultRoute;
          }
        },

        // 获取当前线路的 API Key
        getCurrentApiKey: () => {
          const state = get();
          switch (state.routeType) {
            case "default":
              return DEFAULT_ROUTE_API_KEY;
            case "utools":
              return DEFAULT_ROUTE_API_KEY; // uTools 线路使用默认 API Key
            case "custom":
              return state.customRoute.apiKey;
            default:
              return DEFAULT_ROUTE_API_KEY;
          }
        },

        // 获取当前线路的 API 地址
        getCurrentProxyUrl: () => {
          const state = get();
          switch (state.routeType) {
            case "default":
              return DEFAULT_ROUTE_PROXY_URL;
            case "utools":
              return DEFAULT_ROUTE_PROXY_URL; // uTools 线路使用默认 API 地址
            case "custom":
              return state.customRoute.proxyUrl;
            default:
              return DEFAULT_ROUTE_PROXY_URL;
          }
        },

        // 获取当前线路的模型
        getCurrentModel: () => {
          const config = get().getCurrentRouteConfig();
          return config.model;
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
    routeType: state.routeType,
    defaultRoute: state.defaultRoute,
    utoolsRoute: state.utoolsRoute,
    customRoute: state.customRoute,
    utoolsModels: state.utoolsModels,
  }),
  (config) => {
    storage.setItem(BD_OPENAI_CONFIG_KEY, config);
  },
);
