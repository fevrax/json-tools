"use client";
import React, { useEffect, useRef } from "react";
import { loader, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { cn } from "@nextui-org/react";
import { editor } from "monaco-editor";

interface MonacoJsonEditorProps {
  height?: number;
  value?: string;
  language?: string;
  theme?: string;
}

const MonacoJsonEditor: React.FC<MonacoJsonEditorProps> = ({
  value,
  language,
  theme,
  height,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    console.log("editorHeight", height);
    if (editorRef.current) {
      editorRef.current.layout();
    }
    // calculateHeight();
  }, [height]);

  useEffect(() => {
    console.log("theme", theme);
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

      editorRef.current = editor;

      editor.focus();
    }
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

  return (
    <div
      ref={containerRef}
      className={cn("w-full flex-grow")}
      style={{ height: height }}
    />
  );
};

export default MonacoJsonEditor;
