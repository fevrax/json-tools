import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { OpenAI } from "openai";

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
  customModels: Array<{ value: string; label: string }>;
}
const defaultOpenAIConfig: OpenAIConfig = {
  routeType: "default",
  defaultRoute: {
    model: "json-tools",
    temperature: 0.7,
  },
  utoolsRoute: {
    model: "deepseek-v3", // 使用默认模型
    temperature: 0.7,
  },
  customRoute: {
    apiKey: "",
    model: "gpt-4.1",
    proxyUrl: "https://api.ssooai.com/v1",
    temperature: 0.7,
  },
  utoolsModels: [],
  customModels: [],
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
  fetchCustomModels: () => Promise<void>;
  addCustomModel: (model: string, label?: string) => void;
  removeCustomModel: (model: string) => void;

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
      (set, get) => {
        // 辅助函数：获取可序列化状态
        const getSerializableState = () => {
          const state = get();

          return {
            routeType: state.routeType,
            defaultRoute: state.defaultRoute,
            utoolsRoute: state.utoolsRoute,
            customRoute: state.customRoute,
            utoolsModels: state.utoolsModels,
            customModels: state.customModels,
          };
        };

        return {
          ...defaultOpenAIConfig,

          updateConfig: (config) => {
            set((state) => ({ ...state, ...config }));
            // 保存到存储，只保存可序列化的数据
            storage
              .setItem(BD_OPENAI_CONFIG_KEY, getSerializableState())
              .catch((err) => console.error("Failed to save config:", err));
          },

          updateDefaultRouteConfig: (config) => {
            set((state) => ({
              ...state,
              defaultRoute: { ...state.defaultRoute, ...config },
            }));
            // 保存到存储，只保存可序列化的数据
            storage
              .setItem(BD_OPENAI_CONFIG_KEY, getSerializableState())
              .catch((err) =>
                console.error("Failed to save default route config:", err),
              );
          },

          updateUtoolsRouteConfig: (config) => {
            set((state) => ({
              ...state,
              utoolsRoute: { ...state.utoolsRoute, ...config },
            }));
            // 保存到存储，只保存可序列化的数据
            storage
              .setItem(BD_OPENAI_CONFIG_KEY, getSerializableState())
              .catch((err) =>
                console.error("Failed to save utools route config:", err),
              );
          },

          updateCustomRouteConfig: (config) => {
            set((state) => ({
              ...state,
              customRoute: { ...state.customRoute, ...config },
            }));
            // 保存到存储，只保存可序列化的数据
            storage
              .setItem(BD_OPENAI_CONFIG_KEY, getSerializableState())
              .catch((err) =>
                console.error("Failed to save custom route config:", err),
              );
          },

          resetConfig: () => set(defaultOpenAIConfig),

          syncConfig: async () => {
            try {
              const savedConfig = await storage.getItem(BD_OPENAI_CONFIG_KEY);

              if (savedConfig) {
                // 只提取我们需要的可序列化字段
                const serializableConfig = savedConfig as Partial<OpenAIConfig>;

                // 确保只更新有效字段，而不是完全覆盖
                set((state) => ({
                  ...state,
                  routeType: serializableConfig.routeType || state.routeType,
                  defaultRoute:
                    serializableConfig.defaultRoute || state.defaultRoute,
                  utoolsRoute:
                    serializableConfig.utoolsRoute || state.utoolsRoute,
                  customRoute:
                    serializableConfig.customRoute || state.customRoute,
                  utoolsModels:
                    serializableConfig.utoolsModels || state.utoolsModels,
                  customModels:
                    serializableConfig.customModels || state.customModels,
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
                const formattedModels = models.map((model) => ({
                  value: model.id,
                  label: `${model.label}${model.cost > 0 ? ` (${model.cost}积分)` : ""}`,
                }));

                set((state) => ({ ...state, utoolsModels: formattedModels }));

                // 如果当前没有选择模型或选择的模型不在列表中，自动选择第一个模型
                const currentModel = get().utoolsRoute.model;

                if (
                  !currentModel ||
                  !formattedModels.find((m) => m.value === currentModel)
                ) {
                  const defaultModel =
                    formattedModels[0]?.value || "deepseek-v3";

                  get().updateUtoolsRouteConfig({ model: defaultModel });
                }
              }
            } catch (error) {
              console.error("Failed to fetch Utools models:", error);
            }
          },

          fetchCustomModels: async () => {
            try {
              const state = get();

              // 只有在有API密钥和代理URL时才尝试获取模型列表
              if (!state.customRoute.apiKey || !state.customRoute.proxyUrl) {
                return;
              }

              // 创建临时OpenAI实例用于获取模型
              const openai = new OpenAI({
                apiKey: state.customRoute.apiKey,
                baseURL: state.customRoute.proxyUrl,
                dangerouslyAllowBrowser: true,
              });

              // 获取模型列表
              const response = await openai.models.list();

              if (response.data && Array.isArray(response.data)) {
                // 提取模型信息
                let apiModels = response.data.map((model) => ({
                  value: model.id,
                  label: model.id,
                }));

                // 获取当前存储的自定义模型
                const currentCustomModels = state.customModels.filter(
                  (model) =>
                    !apiModels.some(
                      (apiModel) => apiModel.value === model.value,
                    ),
                );

                // 合并自定义模型和API模型
                const mergedModels = [...currentCustomModels, ...apiModels];

                set({ customModels: mergedModels });
              }
            } catch (error) {
              console.error("Failed to fetch custom models:", error);
            }
          },

          addCustomModel: (model: string, label?: string) => {
            // 如果model为空，不添加
            if (!model.trim()) return;

            set((state) => {
              // 检查模型是否已存在
              const modelExists = state.customModels.some(
                (m) => m.value === model,
              );

              if (modelExists) {
                // 如果模型已存在，不需要添加
                return state;
              }

              // 创建新的模型对象
              const newModel = {
                value: model,
                label: label || model, // 如果没有提供标签，就使用模型名称作为标签
              };

              // 添加到列表前面
              return {
                ...state,
                customModels: [newModel, ...state.customModels],
              };
            });

            // 保存到存储，只保存可序列化的数据
            storage
              .setItem(BD_OPENAI_CONFIG_KEY, getSerializableState())
              .catch((err) =>
                console.error("Failed to save custom model:", err),
              );
          },

          removeCustomModel: (model: string) => {
            set((state) => {
              // 过滤掉要删除的模型
              const filteredModels = state.customModels.filter(
                (m) => m.value !== model,
              );

              return {
                ...state,
                customModels: filteredModels,
              };
            });

            // 保存到存储，只保存可序列化的数据
            storage
              .setItem(BD_OPENAI_CONFIG_KEY, getSerializableState())
              .catch((err) =>
                console.error(
                  "Failed to save after removing custom model:",
                  err,
                ),
              );
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
        };
      },
      {
        name: "OpenAIConfigStore",
        enabled: true,
      },
    ),
  ),
);

// 注意：所有的更新操作已经在各自的方法中包含了保存到存储的逻辑
// 不需要额外的订阅来保存，这可能导致序列化错误
