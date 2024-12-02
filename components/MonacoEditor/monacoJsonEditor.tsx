"use client";
import React, { useState, useEffect, useRef } from "react";
import { loader, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { cn } from "@nextui-org/react";
import { editor } from "monaco-editor";

interface MonacoJsonEditorProps {
  height?: number;
}

const MonacoJsonEditor: React.FC<MonacoJsonEditorProps> = ({ height }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // 初始化编辑器的函数
  const initializeEditor = async () => {
    // 确保只初始化一次
    if (editorRef.current) return;

    loader.config({ monaco });

    const monacoInstance: Monaco = await loader.init();

    if (containerRef.current) {
      console.log("Initializing Monaco editor");
      const editor = monacoInstance.editor.create(containerRef.current, {
        value: "",
        language: "json",
        theme: "vs-dark",
        automaticLayout: true,
        minimap: { enabled: false },
        formatOnType: true,
        formatOnPaste: true,
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
    >
    </div>
  );
};

export default MonacoJsonEditor;
