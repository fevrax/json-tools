import React, { useRef, useEffect, useMemo, useState } from "react";
import { Button, Chip, Select, SelectItem } from "@heroui/react";
import { Icon } from "@iconify/react";

import {
  AIRouteType,
  useOpenAIConfigStore,
  AI_MODELS,
} from "@/store/useOpenAIConfigStore";

// 定义模型选项类型
interface ModelOption {
  value: string;
  label: string;
}

// 快捷指令类型定义
export interface QuickPrompt {
  id: string;
  label: string;
  icon?: string;
  prompt: string;
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "default";
  handler?: () => void; // 可选的自定义处理函数
}

interface AIPromptOverlayProps {
  isOpen: boolean;
  prompt: string;
  placeholderText?: string;
  tipText?: string;
  tipIcon?: string;
  quickPrompts?: QuickPrompt[]; // 新增：快捷指令数组
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onQuickPromptClick?: (quickPrompt: QuickPrompt) => void; // 新增：自定义快捷指令点击处理函数
}

const AIPromptOverlay: React.FC<AIPromptOverlayProps> = ({
  isOpen,
  prompt,
  placeholderText = "输入您的问题...",
  tipText = "提示: 您可以让AI为您处理关于数据修复，数据优化，模拟数据生成等问题",
  tipIcon = "mdi:lightbulb-outline",
  quickPrompts = [], // 默认为空数组
  onPromptChange,
  onSubmit,
  onClose,
  onQuickPromptClick,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isUtoolsAvailable] = useState(
    () => typeof window !== "undefined" && "utools" in window,
  );

  // 从 store 中选择性地只获取需要的状态，避免不必要的重新渲染
  const routeType = useOpenAIConfigStore((state) => state.routeType);
  const defaultModel = useOpenAIConfigStore(
    (state) => state.defaultRoute.model,
  );
  const utoolsModel = useOpenAIConfigStore((state) => state.utoolsRoute.model);
  const customModel = useOpenAIConfigStore((state) => state.customRoute.model);
  const utoolsModels = useOpenAIConfigStore((state) => state.utoolsModels);

  // 单独获取更新函数，避免重新渲染
  const updateConfig = useOpenAIConfigStore((state) => state.updateConfig);
  const updateDefaultRouteConfig = useOpenAIConfigStore(
    (state) => state.updateDefaultRouteConfig,
  );
  const updateUtoolsRouteConfig = useOpenAIConfigStore(
    (state) => state.updateUtoolsRouteConfig,
  );
  const updateCustomRouteConfig = useOpenAIConfigStore(
    (state) => state.updateCustomRouteConfig,
  );
  const fetchUtoolsModels = useOpenAIConfigStore(
    (state) => state.fetchUtoolsModels,
  );

  // 在组件挂载时获取uTools模型
  useEffect(() => {
    if (isUtoolsAvailable && routeType === "utools") {
      fetchUtoolsModels();
    }
  }, [fetchUtoolsModels, isUtoolsAvailable, routeType]);

  // 使用 useMemo 缓存计算结果
  const modelOptions = useMemo((): ModelOption[] => {
    switch (routeType) {
      case "default":
        return AI_MODELS;
      case "utools":
        return utoolsModels.length > 0
          ? utoolsModels
          : [{ value: "deepseek-v3", label: "DeepSeek-V3" }];
      case "custom":
        return [
          { value: "claude-sonnet-4-20250514", label: "Claude Sonnet" },
          { value: "gpt-4o", label: "GPT-4o" },
          { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
        ];
      default:
        return AI_MODELS;
    }
  }, [routeType, utoolsModels]);

  // 使用 useMemo 缓存当前选择的模型
  const currentModel = useMemo(() => {
    switch (routeType) {
      case "default":
        return defaultModel;
      case "utools":
        return utoolsModel;
      case "custom":
        return customModel;
      default:
        return defaultModel;
    }
  }, [routeType, defaultModel, utoolsModel, customModel]);

  // 处理线路变更
  const handleRouteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRouteType = e.target.value as AIRouteType;

    // 如果切换到uTools线路，先获取模型列表
    if (newRouteType === "utools" && isUtoolsAvailable) {
      fetchUtoolsModels();
    }
    updateConfig({ routeType: newRouteType });
  };

  // 处理模型变更
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;

    switch (routeType) {
      case "default":
        updateDefaultRouteConfig({ model: newModel });
        break;
      case "utools":
        updateUtoolsRouteConfig({ model: newModel });
        break;
      case "custom":
        updateCustomRouteConfig({ model: newModel });
        break;
    }
  };

  // 当组件显示时自动聚焦到输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 添加ESC键全局监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 点击外部区域关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        overlayRef.current &&
        !overlayRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 处理快捷指令点击
  const handleQuickPromptClick = (quickPrompt: QuickPrompt) => {
    // 如果传入了自定义点击处理函数，则使用它
    if (onQuickPromptClick) {
      onQuickPromptClick(quickPrompt);

      return;
    }

    // 如果有自定义处理函数，则执行它
    if (quickPrompt.handler) {
      quickPrompt.handler();

      return;
    }

    // 否则执行默认行为：替换提示文本
    onPromptChange(quickPrompt.prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      aria-label="AI 提示对话框"
      aria-modal="true"
      className="absolute z-50 top-[10px] left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl"
      role="dialog"
    >
      <div className="flex flex-col rounded-lg shadow-xl bg-gradient-to-r from-blue-200/30 to-indigo-50 dark:from-neutral-800/80 border border-blue-200 dark:border-neutral-700 overflow-hidden backdrop-blur-sm">
        {/* 输入框区域 */}
        <div className="flex items-center p-4 gap-2">
          <div className="flex items-center flex-1 bg-white dark:bg-neutral-800 rounded-md border border-blue-200 dark:border-neutral-700 pl-2 pr-1 py-1 shadow-inner">
            <Icon
              className="text-indigo-500 mx-2"
              icon="hugeicons:ai-chat-02"
              width={20}
            />
            <input
              ref={inputRef}
              aria-label="AI 提示输入"
              className="h-8 flex-1 bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-neutral-500 text-sm"
              placeholder={placeholderText}
              type="text"
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
            />
            {prompt && (
              <Button
                isIconOnly
                aria-label="清除输入"
                className="mr-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                size="sm"
                variant="light"
                onPress={() => onPromptChange("")}
              >
                <Icon icon="mdi:close" width={16} />
              </Button>
            )}
          </div>

          <Button
            isIconOnly
            aria-label="发送提问"
            className="w-12 bg-gradient-to-r from-blue-500 to-indigo-600 order-none"
            color="primary"
            size="sm"
            onPress={onSubmit}
          >
            <Icon icon="tabler:send" width={16} />
          </Button>
        </div>

        {/* AI 配置选择器 - 移到输入框下方 */}
        <div className="flex items-center justify-between px-4 pb-3 gap-2 border-t border-blue-100 dark:border-neutral-700/50 bg-white/30 dark:bg-neutral-800/30">
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
              线路:
            </div>
            <Select
              aria-label="选择 AI 线路"
              className="min-w-[120px]"
              selectedKeys={new Set([routeType])}
              size="sm"
              onChange={handleRouteChange}
            >
              <SelectItem key="default">默认线路</SelectItem>
              <SelectItem
                key="utools"
                description={!isUtoolsAvailable ? "未安装uTools" : undefined}
                isDisabled={!isUtoolsAvailable}
              >
                uTools
              </SelectItem>
              <SelectItem key="custom">私有线路</SelectItem>
            </Select>
          </div>

          {/* 只有在非默认线路下才显示模型选择 */}
          {routeType !== "default" && (
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                模型:
              </div>
              <Select
                aria-label="选择 AI 模型"
                className="min-w-[140px]"
                selectedKeys={new Set([currentModel])}
                size="sm"
                onChange={handleModelChange}
              >
                {modelOptions.map((model) => (
                  <SelectItem key={model.value}>{model.label}</SelectItem>
                ))}
              </Select>
            </div>
          )}
        </div>

        {/* 快捷指令区域 */}
        {quickPrompts.length > 0 && (
          <div className="px-4 py-4 flex flex-wrap gap-2 border-t border-blue-100 dark:border-neutral-700/50 bg-white/30 dark:bg-neutral-800/30">
            {quickPrompts.map((prompt) => (
              <Chip
                key={prompt.id}
                className="cursor-pointer hover:scale-105 transition-transform"
                color={prompt.color || "primary"}
                size="sm"
                startContent={
                  prompt.icon && <Icon icon={prompt.icon} width={14} />
                }
                variant="flat"
                onClick={() => handleQuickPromptClick(prompt)}
              >
                {prompt.label}
              </Chip>
            ))}
          </div>
        )}

        <div className="px-4 pb-4 text-xs text-gray-500 dark:text-gray-400 flex items-center">
          <Icon className="mr-1" icon={tipIcon} width={14} />
          <span>{tipText}</span>
        </div>
      </div>
    </div>
  );
};

export default AIPromptOverlay;
