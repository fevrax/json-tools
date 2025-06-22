import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

import { useOpenAIConfigStore } from "@/store/useOpenAIConfigStore.ts";
import toast from "@/utils/toast.tsx";

/**
 * OpenAI 服务
 * 提供与 OpenAI API 通信的基础功能
 */
export class OpenAIService {
  private openai: OpenAI | null = null;
  private apiKey: string = "";
  private model: string = "";
  private useProxy: boolean = false;
  private proxyUrl: string = "";
  private temperature: number = 0.7;
  maxTokens: number = 10000;

  /**
   * 初始化OpenAI服务
   * @param config 配置信息，如果不提供则从store获取
   */
  constructor(config?: {
    apiKey: string;
    model: string;
    useProxy: boolean;
    proxyUrl: string;
    temperature: number;
  }) {
    if (config) {
      this.apiKey = config.apiKey;
      this.model = config.model;
      this.useProxy = config.useProxy;
      this.proxyUrl = config.proxyUrl;
      this.temperature = config.temperature;
      this.initOpenAI();
    }
  }

  /**
   * 从store同步配置
   */
  public syncConfig(): void {
    const openaiConfig = useOpenAIConfigStore.getState();

    this.apiKey = openaiConfig.apiKey;
    this.model = openaiConfig.model;
    this.useProxy = openaiConfig.useProxy;
    this.proxyUrl = openaiConfig.proxyUrl;
    this.temperature = openaiConfig.temperature;
    this.initOpenAI();
  }

  /**
   * 初始化OpenAI客户端
   */
  private initOpenAI(): void {
    if (!this.apiKey) {
      this.openai = null;

      return;
    }

    this.openai = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.useProxy && this.proxyUrl ? this.proxyUrl : undefined,
      dangerouslyAllowBrowser: true,
    });
  }

  /**
   * 验证服务是否已准备好
   */
  private validateService(): boolean {
    if (!this.openai) {
      if (!this.apiKey) {
        toast.error("请在设置中输入您的 OpenAI API 密钥");
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
   * 发送流式请求到 OpenAI
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

    // 开始处理
    callbacks.onStart?.();
    callbacks.onProcessing?.("Connecting to OpenAI...");

    // 使用流式请求
    const stream = await this.openai!.chat.completions.create({
      model: this.model,
      messages: messages,
      temperature: this.temperature,
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
