import React, { useRef, useEffect } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

interface AIPromptOverlayProps {
  isOpen: boolean;
  prompt: string;
  isLoading?: boolean;
  placeholderText?: string;
  tipText?: string;
  tipIcon?: string;
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const AIPromptOverlay: React.FC<AIPromptOverlayProps> = ({
  isOpen,
  prompt,
  isLoading = false,
  placeholderText = "向AI提问关于当前数据的问题...",
  tipText = "提示: 您可以让AI为您处理关于数据修复，数据优化，模拟数据生成等问题",
  tipIcon = "mdi:lightbulb-outline",
  onPromptChange,
  onSubmit,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

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
            isLoading={isLoading}
            size="sm"
            onPress={onSubmit}
          >
            {!isLoading && <Icon icon="tabler:send" width={16} />}
          </Button>
        </div>

        <div className="px-4 pb-4 text-xs text-gray-500 dark:text-gray-400 flex items-center">
          <Icon className="mr-1" icon={tipIcon} width={14} />
          <span>{tipText}</span>
        </div>
      </div>
    </div>
  );
};

export default AIPromptOverlay;
