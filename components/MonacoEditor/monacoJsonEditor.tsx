"use client";
import React, { useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { loader, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import {
  cn,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Chip,
} from "@nextui-org/react";
import { editor } from "monaco-editor";
import { toast } from "sonner";

import { sleep } from "@/utils/time";
import { JsonErrorInfo, jsonParseError } from "@/utils/json";
import "@/styles/monaco.css";

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

  const {
    isOpen: jsonErrorDetailsModel,
    onOpen: openJsonErrorDetailsModel,
    onOpenChange: onOpenJsonErrorDetailsModelChange,
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

  const contextLines = useMemo(() => {
    if (!parseJsonError.current || !parseJsonError.current.context) return 0;
    if (!parseJsonError.current.context) return 0;

    return parseJsonError.current.context.split("\n").length;
  }, [parseJsonError.current?.context]);

  const errorStartLine = useMemo(() => {
    if (!parseJsonError.current?.line) return 0;

    return Math.max(
      1,
      parseJsonError.current?.line - Math.floor(contextLines / 2),
    );
  }, [parseJsonError.current?.line, contextLines]);

  // 初始化编辑器的函数
  const initializeEditor = async () => {
    openJsonErrorDetailsModel();

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
      <Modal
        backdrop="blur"
        isOpen={jsonErrorDetailsModel}
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
            exit: {
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeIn",
              },
            },
          },
        }}
        size="xl"
        onOpenChange={onOpenJsonErrorDetailsModelChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {parseJsonError.current?.message}
              </ModalHeader>
              <ModalBody className="text-sm">
                <p>
                  错误位置：第
                  <Chip
                    className="mx-1"
                    classNames={{
                      base: "border px-0.5",
                    }}
                    color="warning"
                    radius="sm"
                    size="sm"
                    variant="bordered"
                  >
                    {parseJsonError.current?.line}
                  </Chip>
                  行， 第
                  <Chip
                    className="mx-1"
                    classNames={{
                      base: "border px-0.5",
                    }}
                    color="warning"
                    radius="sm"
                    size="sm"
                    variant="bordered"
                  >
                    {parseJsonError.current?.column}
                  </Chip>
                  列
                </p>
                <p className="mt-2">
                  异常信息：
                  <span className={"text-red-500"}>
                    {parseJsonError.current?.message}
                  </span>
                </p>
                <div className="context-section">
                  <div className="context-wrapper">
                    <div className="line-numbers">
                      {[...Array(contextLines)].map((_, i) => {
                        return (
                          <span
                            key={i}
                            className={cn({
                              "error-line":
                                errorStartLine + i - 1 ===
                                parseJsonError.current?.line,
                            })}
                          >
                            {errorStartLine + i - 1}
                          </span>
                        );
                      })}
                    </div>
                    <pre className="context-content">
                      <code>{parseJsonError.current?.context}</code>
                    </pre>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Action
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
});

MonacoJsonEditor.displayName = "MonacoJsonEditor";

export default MonacoJsonEditor;
