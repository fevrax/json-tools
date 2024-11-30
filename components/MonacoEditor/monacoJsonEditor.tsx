"use client";
import React, { useState, useEffect, useRef } from "react";
import { Editor } from "@monaco-editor/react";
import { editor } from "monaco-editor";

const MonacoJsonEditor: React.FC = () => {
  const [editorValue, setEditorValue] = useState<string>("{}");
  const [editorHeight, setEditorHeight] = useState<number>(500);
  const containerRef = useRef<HTMLDivElement>(null);

  // 编辑器配置
  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    language: "json",
    theme: "vs-dark",
    automaticLayout: true,
    minimap: { enabled: false },
    formatOnType: true,
    formatOnPaste: true,
  };

  // 处理编辑器内容变化
  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      try {
        // 尝试解析 JSON 以验证格式
        JSON.parse(value);
        setEditorValue(value);
      } catch (error) {
        console.error("Invalid JSON", error);
      }
    }
  };

  // 处理编辑器挂载
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    // 可以在这里添加额外的编辑器配置或事件监听
    editor.focus();
  };

  // 计算高度的函数
  const calculateHeight = () => {
    if (containerRef.current) {
      const windowHeight = window.innerHeight;
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const newHeight = windowHeight - containerTop - 20; // 减去一些额外的边距
      setEditorHeight(Math.max(newHeight, 300)); // 设置最小高度
    }
  };

  // 添加窗口大小变化监听器
  useEffect(() => {
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => {
      window.removeEventListener('resize', calculateHeight);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full flex-grow"
    >
      <Editor
        defaultLanguage="json"
        defaultValue={editorValue}
        height={editorHeight}
        options={editorOptions}
        theme="vs-dark"
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
      />
    </div>
  );
};

export default MonacoJsonEditor;
