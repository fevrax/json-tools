"use client";
import React, { useEffect, useImperativeHandle, useRef } from "react";
import { loader, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { cn } from "@nextui-org/react";
import { editor } from "monaco-editor";
import { toast } from "sonner";
import { Icon } from "@iconify/react";

import { sleep } from "@/utils/time";
import { JsonErrorInfo, jsonParseError } from "@/utils/json";
import { JsonErrorToast } from "@/utils/sonner";
export interface MonacoJsonEditorProps {
  tabKey: string;
  height?: number;
  value?: string;
  language?: string;
  theme?: string;
}

export interface MonacoJsonEditorRef {
  focus: () => void;
}

const MonacoJsonEditor = React.forwardRef<
  MonacoJsonEditorRef,
  MonacoJsonEditorProps
>(({ value, language, theme, height }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  let parseJsonError: JsonErrorInfo | undefined; // 格式化错误信息

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
    // calculateHeight();
  }, [height]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        theme: theme,
      });
    }
    // calculateHeight();
  }, [theme]);

  // 初始化编辑器的函数
  const initializeEditor = async () => {
    // 确保只初始化一次
    if (editorRef.current) return;

    loader.config({ monaco });

    const monacoInstance: Monaco = await loader.init();

    if (containerRef.current) {
      console.log("Initializing Monaco editor");
      const editor = monacoInstance.editor.create(containerRef.current, {
        value: value || "",
        language: language || "json",
        minimap: {
          enabled: true, // 启用缩略图
        },
        colorDecorators: true, // 颜色装饰器
        readOnly: false, // 是否开启已读功能
        theme: theme || "vs-light", // 主题
        mouseWheelZoom: true, // 启用鼠标滚轮缩放
        formatOnPaste: true, // 粘贴时自动格式化
        formatOnType: true, // 输入时自动格式化
        wordBasedSuggestions: "currentDocument", // 启用基于单词的建议
        scrollBeyondLastLine: false, // 禁用滚动超出最后一行
        suggestOnTriggerCharacters: true, // 在触发字符时显示建议
        acceptSuggestionOnCommitCharacter: true, // 接受关于提交字符的建议
        acceptSuggestionOnEnter: "smart", // 按Enter键接受建议
        wordWrap: "on", // 自动换行
        autoSurround: "never", // 是否应自动环绕选择
        cursorBlinking: "smooth", // 光标动画样式
        cursorSmoothCaretAnimation: "on", // 是否启用光标平滑插入动画  当你在快速输入文字的时候 光标是直接平滑的移动还是直接"闪现"到当前文字所处位置
        cursorStyle: "line", //  光标样式
        cursorSurroundingLines: 0, // 光标环绕行数 当文字输入超过屏幕时 可以看见右侧滚动条中光标所处位置是在滚动条中间还是顶部还是底部 即光标环绕行数 环绕行数越大 光标在滚动条中位置越居中
        cursorSurroundingLinesStyle: "all", // "default" | "all" 光标环绕样式
        links: true, // 是否点击链接
      });

      editor.focus();

      // 添加粘贴事件监听
      editor.onDidPaste(async (e) => {
        if (editor.getValue() && e.range.startLineNumber < 2) {
          await sleep(150);
          const ok = formatValidate();

          if (!ok) {
            showAutoFixNotify();
          }
        }
      });

      editorRef.current = editor;
    }
  };

  const formatValidate = (): boolean => {
    if (!editorRef.current) {
      return false;
    }
    const jsonErr = jsonParseError(editorRef.current?.getValue());

    if (jsonErr) {
      parseJsonError = jsonErr;

      return false;
    }

    return format();
  };

  const showAutoFixNotify = () => {
    toast.custom(
      (id) => (
        <div
          className={`
        w-96 
        bg-white dark:bg-zinc-800 
        shadow-lg 
        rounded-lg 
        pointer-events-auto 
        flex 
        ring-1 
        ring-black/5 dark:ring-white/10 
        p-4 
        relative
      `}
        >
          <button
            className="absolute top-2 right-2 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            onClick={() => toast.dismiss(id)}
          >
            <Icon
              className="h-5 w-5"
              icon="gg:close"
            />
          </button>

          <div className="flex flex-col w-full space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Icon
                  className="h-6 w-6 text-amber-600"
                  icon="carbon:warning"
                />
              </div>

              <div className="flex-1">
                <p className="text-gray-900 dark:text-white text-lg">
                  {`第 ${parseJsonError?.line} 行，第 ${parseJsonError?.column} 列，格式错误`}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-base">
                  {parseJsonError?.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-1">
              <button
                className={cn(
                  "px-3 py-1 bg-purple-500 text-white rounded-md text-sm hover:bg-purple-700 transition-colors",
                )}
                onClick={() => {
                  // 确认逻辑
                  toast.dismiss(id);
                }}
              >
                查看详情
              </button>
            </div>
          </div>
        </div>
      ),
      {
        duration: 4000, // 显示时间
        position: "top-right", // 弹出位置
      },
    );

  };

  const format = (): boolean => {
    if (!editorRef.current) {
      return false;
    }
    if (editorRef.current.getValue() === "") {
      toast("暂无内容");

      return false;
    }
    editorRef.current.getAction("editor.action.formatDocument")?.run();

    return true;
  };

  // 添加窗口大小变化监听器
  useEffect(() => {
    // 使用 setTimeout 确保在 React 严格模式下只执行一次
    const timeoutId = setTimeout(() => {
      initializeEditor();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      // 如果编辑器已经创建，则销毁
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []); // 空依赖数组确保只在挂载时执行

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    },
  }));

  return (
    <div
      ref={containerRef}
      className={cn("w-full flex-grow")}
      style={{ height: height }}
    />
  );
});

MonacoJsonEditor.displayName = "MonacoJsonEditor";

export default MonacoJsonEditor;
