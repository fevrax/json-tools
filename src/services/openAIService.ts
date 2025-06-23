import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

import {
  useOpenAIConfigStore,
  AIRouteType,
  DEFAULT_ROUTE_API_KEY,
  DEFAULT_ROUTE_PROXY_URL,
} from "@/store/useOpenAIConfigStore.ts";
import toast from "@/utils/toast.tsx";

// 检查 utools 是否可用
const isUtoolsAvailable = typeof window !== "undefined" && "utools" in window;

/**
 * OpenAI 服务
 * 提供与 OpenAI API 通信的基础功能
 */
export class OpenAIService {
  private openai: OpenAI | null = null;
  private routeType: AIRouteType = "default";
  maxTokens: number = 10000;

  /**
   * 初始化OpenAI服务
   */
  constructor() {
    // 空构造函数，通过 syncConfig 初始化
  }

  /**
   * 从store同步配置
   */
  public syncConfig(): void {
    const openaiStore = useOpenAIConfigStore.getState();

    this.routeType = openaiStore.routeType;
    this.initOpenAI();
  }

  /**
   * 获取当前线路的 API Key
   */
  private getCurrentApiKey(): string {
    return useOpenAIConfigStore.getState().getCurrentApiKey();
  }

  /**
   * 获取当前线路的 API 地址
   */
  private getCurrentProxyUrl(): string {
    return useOpenAIConfigStore.getState().getCurrentProxyUrl();
  }

  /**
   * 获取当前线路的模型
   */
  private getCurrentModel(): string {
    return useOpenAIConfigStore.getState().getCurrentModel();
  }

  /**
   * 获取当前线路的温度参数
   */
  private getCurrentTemperature(): number {
    const config = useOpenAIConfigStore.getState().getCurrentRouteConfig();

    return config.temperature;
  }

  /**
   * 初始化OpenAI客户端
   */
  private initOpenAI(): void {
    // 如果是 utools 线路，不需要初始化 OpenAI 客户端
    if (this.routeType === "utools") {
      if (!isUtoolsAvailable) {
        toast.error("uTools API 不可用，请确保在 uTools 环境中运行");
        this.openai = null;
      }

      return;
    }

    const apiKey = this.getCurrentApiKey();
    const proxyUrl = this.getCurrentProxyUrl();

    if (!apiKey) {
      this.openai = null;

      return;
    }

    // 根据不同的线路类型进行初始化
    switch (this.routeType) {
      case "default":
        // 默认线路使用内置的代理
        this.openai = new OpenAI({
          apiKey: DEFAULT_ROUTE_API_KEY,
          baseURL: DEFAULT_ROUTE_PROXY_URL,
          dangerouslyAllowBrowser: true,
        });
        break;

      case "custom":
        // 自定义线路，使用用户提供的API地址
        this.openai = new OpenAI({
          apiKey,
          baseURL: proxyUrl,
          dangerouslyAllowBrowser: true,
        });
        break;
    }
  }

  /**
   * 验证服务是否已准备好
   */
  private validateService(): boolean {
    // 如果是 utools 线路，检查 utools 是否可用
    if (this.routeType === "utools") {
      if (!isUtoolsAvailable) {
        toast.error("uTools API 不可用，请确保在 uTools 环境中运行");

        return false;
      }

      return true;
    }

    if (!this.openai) {
      const apiKey = this.getCurrentApiKey();

      if (!apiKey) {
        if (this.routeType === "custom") {
          toast.error("请在设置中输入您的 API 密钥");
        } else {
          // 默认线路应该总是有 API Key
          toast.error("API 密钥配置错误");
        }
      } else {
        this.initOpenAI();
        if (!this.openai) {
          toast.error("OpenAI 服务初始化失败");

          return false;
        }
      }

      return false;
    }

    return true;
  }

  /**
   * 使用 utools.ai API 发送请求
   */
  private async createUtoolsChatCompletion(
    messages: any[],
    callbacks: {
      onStart?: () => void;
      onProcessing?: (step: string) => void;
      onChunk?: (chunk: string, accumulated: string) => void;
      onComplete?: (final: string) => void;
      onError?: (error: Error) => void;
    },
  ): Promise<boolean> {
    if (!isUtoolsAvailable) {
      callbacks.onError?.(new Error("uTools API 不可用"));

      return false;
    }

    try {
      callbacks.onStart?.();
      callbacks.onProcessing?.("连接到 uTools AI...");

      let accumulated = "";

      // 获取模型和温度参数
      const modelToUse = this.getCurrentModel();

      // 转换消息格式
      const utoolsMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // 准备 utools.ai 选项参数
      const options = {
        model: modelToUse,
        messages: utoolsMessages,
        // 可以在这里添加其他 utools.ai 支持的参数
      };

      callbacks.onProcessing?.(`AI 正在使用 ${modelToUse} 模型处理数据...`);

      // 创建取消标记
      let isCancelled = false;

      // 创建一个 Promise 来处理 utools.ai 的调用
      const promise = (window as any).utools.ai(
        options,
        (chunk: { content?: string; reasoning_content?: string }) => {
          if (isCancelled) return;

          if (chunk.content) {
            accumulated += chunk.content;
            callbacks.onChunk?.(chunk.content, accumulated);
          }

          // 如果存在推理内容，也可以选择处理
          if (chunk.reasoning_content) {
            callbacks.onProcessing?.("AI 正在推理中...");
          }
        },
      );

      // 添加取消方法
      const cancelablePromise = promise as Promise<any> & {
        abort?: () => void;
      };

      // 处理调用结果
      await cancelablePromise;

      if (!isCancelled) {
        callbacks.onComplete?.(accumulated);
        callbacks.onProcessing?.("处理完成");
      }

      return true;
    } catch (error) {
      console.error("uTools AI 调用出错:", error);
      callbacks.onError?.(error as Error);

      return false;
    }
  }

  /**
   * 发送流式请求到 AI 服务
   * @param messages 消息数组
   * @param callbacks 回调函数，用于处理流式响应
   * @returns 是否成功开始请求
   */
  public async createChatCompletion(
    messages: ChatCompletionMessageParam[],
    callbacks: {
      onStart?: () => void;
      onProcessing?: (step: string) => void;
      onChunk?: (chunk: string, accumulated: string) => void;
      onComplete?: (final: string) => void;
      onError?: (error: Error) => void;
    } = {},
  ): Promise<boolean> {
    // 验证服务是否已初始化
    if (!this.validateService()) {
      return false;
    }

    // 如果是 utools 线路，使用 utools.ai API
    if (this.routeType === "utools") {
      return this.createUtoolsChatCompletion(messages, callbacks);
    }

    // 开始处理
    callbacks.onStart?.();
    callbacks.onProcessing?.("Connecting to OpenAI...");

    // 根据线路类型获取模型和温度
    const modelToUse = this.getCurrentModel();
    const temperature = this.getCurrentTemperature();

    // 使用流式请求
    const stream = await this.openai!.chat.completions.create({
      model: modelToUse,
      messages: messages,
      temperature: temperature,
      stream: true,
    });

    try {
      callbacks.onProcessing?.("AI 正在接收数据...");

      let accumulated = "";

      callbacks.onProcessing?.("AI 正在深度思考...");

      // 处理流
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";

        if (content) {
          accumulated += content;
          // 回调处理每个块
          callbacks.onChunk?.(content, accumulated);
        }
      }

      callbacks.onComplete?.(accumulated);
      callbacks.onProcessing?.("处理完成");

      return true;
    } catch (err) {
      stream.controller.abort();
      const error = err as Error;

      callbacks.onError?.(error);

      return false;
    }
  }

  /**
   * 创建一个预设的OpenAI服务实例
   * @returns OpenAIService实例
   */
  public static createInstance(): OpenAIService {
    const service = new OpenAIService();

    service.syncConfig();

    return service;
  }
}

// 导出单例实例
export const openAIService = OpenAIService.createInstance();
