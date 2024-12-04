"use client";
import React, { useEffect, useImperativeHandle, useRef } from "react";
import { loader, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { cn, useDisclosure } from "@nextui-org/react";
import { editor } from "monaco-editor";
import { toast } from "sonner";

import { sleep } from "@/utils/time";
import { JsonErrorInfo, jsonParseError, repairJson } from "@/utils/json";
import ErrorModal from "@/components/MonacoEditor/errorModal";
import "@/styles/monaco.css";
import OperationBar from "@/components/MonacoEditor/operationBar";

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
  const parseJsonError = useRef<JsonErrorInfo | null>(null);

  let errorDecorations: monaco.editor.IEditorDecorationsCollection | null =
    null;

  const {
    isOpen: jsonErrorDetailsModel,
    onOpen: openJsonErrorDetailsModel,
    onClose: closeJsonErrorDetailsModel,
  } = useDisclosure();

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
        wordBasedSuggestions: "allDocuments", // 启用基于单词的建议
        wordBasedSuggestionsOnlySameLanguage: true, // 仅在相同语言下启用基于单词的建议
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

  const formatValidate = () => {
    if (!editorRef.current) {
      return false;
    }
    const jsonErr = jsonParseError(editorRef.current?.getValue());

    if (jsonErr) {
      parseJsonError.current = jsonErr;

      return false;
    }

    return format();
  };

  const showAutoFixNotify = () => {
    toast.warning(
      `第 ${parseJsonError.current?.line} 行，第 ${parseJsonError.current?.column} 列，格式错误`,
      {
        description: parseJsonError.current?.message,
        action: {
          label: "查看详情",
          onClick: () => {
            openJsonErrorDetailsModel();
          },
        },
        position: "bottom-right",
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

  // 高亮错误行
  const highlightErrorLine = (lineNumber: number): boolean => {
    if (!editorRef.current) {
      return false;
    }
    // 滚动到错误行
    editorRef.current.revealLineInCenter(lineNumber);
    // 如果存在旧的装饰，先清除
    if (errorDecorations) {
      errorDecorations.clear();
    }

    // 创建新的装饰集合
    errorDecorations = editorRef.current.createDecorationsCollection([
      {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: "errorLineHighlight",
          glyphMarginClassName: "",
        },
      },
    ]);
    // 5秒后移除高亮
    setTimeout(() => {
      if (errorDecorations) {
        errorDecorations.clear();
      }
    }, 5000);

    return true;
  };

  // 一键定位到错误行
  const goToErrorLine = () => {
    if (!parseJsonError.current || parseJsonError.current.line <= 0) {
      toast.error("一键定位失败");

      return;
    }
    closeJsonErrorDetailsModel();

    highlightErrorLine(parseJsonError.current.line);
    toast.success("一键定位成功");
  };

  const autoFix = (): boolean => {
    try {
      const jsonText = editorRef.current?.getValue() || "";

      if (jsonText === "") {
        toast.warning("暂无内容");

        return false;
      }
      const repair = repairJson(jsonText);

      setEditorValue(repair);
      closeJsonErrorDetailsModel();
      toast.success("修复成功");

      return true;
    } catch (e) {
      console.error("repairJson", e);
      toast.error("修复失败，可能不是有效的 Json 数据");

      return false;
    }
  };

  // 设置编辑器内容，保留历史, 支持 ctrl + z 撤销
  const setEditorValue = (jsonText: string) => {
    if (!editorRef.current) {
      return;
    }
    const model = editorRef.current.getModel();

    if (!model) {
      return;
    }
    editorRef.current?.executeEdits("", [
      {
        range: model.getFullModelRange(),
        text: jsonText,
        forceMoveMarkers: true,
      },
    ]);
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
    <>
      <div
        ref={containerRef}
        className={cn("w-full flex-grow")}
        style={{ height: height }}
      />
      <ErrorModal
        isOpen={jsonErrorDetailsModel}
        parseJsonError={parseJsonError.current}
        onAutoFix={autoFix}
        onClose={closeJsonErrorDetailsModel}
        onGotoErrorLine={goToErrorLine}
      />
    </>
  );
});

MonacoJsonEditor.displayName = "MonacoJsonEditor";

export default MonacoJsonEditor;
