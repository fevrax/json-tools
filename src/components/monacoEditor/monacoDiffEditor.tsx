import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { cn } from "@heroui/react";
import { editor } from "monaco-editor";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

import toast from "@/utils/toast";
import { MonacoDiffEditorEditorType } from "@/components/monacoEditor/monacoEntity";
import { sortJson } from "@/utils/json";
import { useTabStore } from "@/store/useTabStore";
import DraggableMenu from "@/components/monacoEditor/draggableMenu";
import AIPromptOverlay from "@/components/ai/AIPromptOverlay";
import { OpenAIService } from "@/services/openAIService";

import "@/styles/monaco.css";

export interface MonacoDiffEditorProps {
  tabKey: string;
  tabTitle?: string;
  height?: number | string;
  originalValue: string;
  modifiedValue: string;
  language?: string;
  theme?: string;
  onUpdateOriginalValue: (value: string) => void;
  onUpdateModifiedValue?: (value: string) => void;
  onMount?: () => void;

  ref?: React.Ref<MonacoDiffEditorRef>;
}

export interface MonacoDiffEditorRef {
  focus: () => void;
  layout: () => void;
  copy: (type?: MonacoDiffEditorEditorType) => boolean;
  format: (type?: MonacoDiffEditorEditorType) => boolean;
  clear: (type?: MonacoDiffEditorEditorType) => boolean;
  fieldSort: (
    type?: MonacoDiffEditorEditorType,
    sort?: "asc" | "desc",
  ) => boolean;
  updateOriginalValue: (value: string) => void;
  updateModifiedValue: (value: string) => void;
  showAiPrompt: () => void;
}

const MonacoDiffEditor: React.FC<MonacoDiffEditorProps> = ({
  originalValue,
  modifiedValue,
  language,
  theme,
  height,
  tabKey,
  onUpdateOriginalValue,
  onUpdateModifiedValue,
  onMount,
  ref,
}) => {
  const { getTabByKey } = useTabStore();
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const originalEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const modifiedEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // AI相关状态
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiResponse, setShowAiResponse] = useState(false);
  const aiEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const aiContainerRef = useRef<HTMLDivElement>(null);
  const aiPanelRef = useRef<HTMLDivElement>(null);
  const [aiPanelHeight, setAiPanelHeight] = useState<number>(300); // 默认高度
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);

  // 从 store 获取当前 tab 的设置
  const currentTab = getTabByKey(tabKey);
  const editorSettings = currentTab?.editorSettings || {
    fontSize: 14,
    language: language || "json",
  };

  // 菜单状态
  const [currentLanguage, setCurrentLanguage] = useState(
    editorSettings.language,
  );
  const [fontSize, setFontSize] = useState(editorSettings.fontSize);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [height]);

  useEffect(() => {
    if (editorRef.current) {
      const options: editor.IStandaloneDiffEditorConstructionOptions = {
        theme: theme,
      };

      editorRef.current.updateOptions(options);
    }
  }, [theme]);

  // 监听字体大小变化
  useEffect(() => {
    updateEditorOptions({
      fontSize: fontSize,
    });
  }, [fontSize]);

  // 监听语言变化
  useEffect(() => {
    if (originalEditorRef.current && modifiedEditorRef.current) {
      const originalModel = originalEditorRef.current.getModel();
      const modifiedModel = modifiedEditorRef.current.getModel();

      if (originalModel && modifiedModel) {
        monaco.editor.setModelLanguage(originalModel, currentLanguage);
        monaco.editor.setModelLanguage(modifiedModel, currentLanguage);
      }
    }
  }, [currentLanguage]);

  // 简化的鼠标移动处理函数 - 直接修改DOM，不经过React状态更新
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !aiPanelRef.current) return;

      const deltaY = dragStartY.current - e.clientY;
      const newHeight = Math.min(
        Math.max(100, dragStartHeight.current + deltaY), // 最小高度100px
        window.innerHeight * 0.8, // 最大高度为屏幕高度的80%
      );

      // 直接修改DOM元素的高度 - 避免React状态更新延迟
      aiPanelRef.current.style.height = `${newHeight}px`;

      // 同时更新编辑器容器高度以保持对应关系
      if (editorContainerRef.current) {
        editorContainerRef.current.style.height = `calc(100% - ${newHeight}px)`;
      }

      // 请求布局更新
      if (aiEditorRef.current) {
        aiEditorRef.current.layout();
      }
      if (editorRef.current) {
        editorRef.current.layout();
      }
    },
    [isDragging],
  );

  // 鼠标抬起处理函数 - 完全重写
  const handleMouseUp = useCallback(() => {
    if (!isDragging || !aiPanelRef.current) return;

    // 获取当前面板高度
    const currentHeight = parseInt(
      aiPanelRef.current.style.height || `${aiPanelHeight}`,
      10,
    );

    // 更新React状态以保持同步 - 但这不会触发视觉变化，因为DOM已经更新了
    setAiPanelHeight(currentHeight);
    setIsDragging(false);

    // 不需要其他任何操作 - DOM已经是最终状态
  }, [isDragging, aiPanelHeight]);

  // 开始拖动处理函数 - 简化
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // 防止文本选择等默认行为
      dragStartY.current = e.clientY;
      dragStartHeight.current = aiPanelHeight;
      setIsDragging(true);
    },
    [aiPanelHeight],
  );

  // 添加useEffect来处理鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // 拖动时禁用文本选择，提升体验
      document.body.style.userSelect = "none";
      document.body.style.cursor = "ns-resize";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      // 恢复文本选择
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 创建差异编辑器实例
  async function createDiffEditor() {
    loader.config({ monaco });

    loader.init().then((monacoInstance) => {
      if (editorContainerRef.current) {
        // 创建差异编辑器
        editorRef.current = monacoInstance.editor.createDiffEditor(
          editorContainerRef.current,
          {
            fontSize: fontSize,
            originalEditable: true, // 允许编辑原始文本
            renderSideBySide: true, // 并排显示
            useInlineViewWhenSpaceIsLimited: false, // 当空间有限时使用InlineView
            minimap: {
              enabled: true, // 启用缩略图
            },
            // fontFamily: `${jetbrainsMono.style.fontFamily}, "Arial","Microsoft YaHei","黑体","宋体", sans-serif`, // 字体
            colorDecorators: true, // 颜色装饰器
            readOnly: false, // 是否开启已读功能
            theme: theme || "vs-light", // 主题
            mouseWheelZoom: true, // 启用鼠标滚轮缩放
            formatOnPaste: false, // 粘贴时自动格式化
            formatOnType: false, // 输入时自动格式化
            automaticLayout: true, // 自动布局
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
            diffAlgorithm: "advanced",
          },
        );
        onMount && onMount();

        // 设置模型
        const originalModel = monacoInstance.editor.createModel(
          originalValue,
          language || "json",
        );
        const modifiedModel = monacoInstance.editor.createModel(
          modifiedValue,
          language || "json",
        );

        editorRef.current.setModel({
          original: originalModel,
          modified: modifiedModel,
        });

        // 获取两个编辑器实例
        originalEditorRef.current = editorRef.current.getOriginalEditor();
        modifiedEditorRef.current = editorRef.current.getModifiedEditor();

        // 监听原始编辑器内容变化
        originalEditorRef.current.onDidChangeModelContent(() => {
          onUpdateOriginalValue(originalEditorRef.current!.getValue());
        });

        // 监听修改编辑器内容变化
        modifiedEditorRef.current.onDidChangeModelContent(() => {
          onUpdateModifiedValue &&
            onUpdateModifiedValue(modifiedEditorRef.current!.getValue());
        });
      }
    });
  }

  // 确保编辑器只创建一次
  useEffect(() => {
    // 使用 setTimeout 确保在 React 严格模式下只执行一次
    const timeoutId = setTimeout(() => {
      createDiffEditor();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      // 如果编辑器已经创建，则销毁
      if (editorRef.current) {
        // editorRef.current?.dispose();
      }
    };
  }, []); // 空依赖数组确保只在挂载时执行

  // 处理AI提交
  const handleAiSubmit = async () => {
    if (!aiPrompt.trim()) {
      toast.error("请输入提示词");

      return;
    }

    setIsAiLoading(true);
    setShowAiPrompt(false);
    setShowAiResponse(true);

    // 创建一个中止控制器用于取消请求
    const controller = new AbortController();

    // 将控制器保存在组件状态上，以便停止按钮可以访问
    (window as any).currentAiController = controller;

    // 先让UI渲染完成，延迟执行AI请求
    setTimeout(async () => {
      // 初始化AI编辑器，如果还没有初始化
      if (!aiEditorRef.current && aiContainerRef.current) {
        const monacoInstance = await loader.init();

        aiEditorRef.current = monacoInstance.editor.create(
          aiContainerRef.current,
          {
            value: "",
            language: "go",
            readOnly: false,
            theme: theme || "vs-light",
            minimap: { enabled: false },
            wordWrap: "on",
            fontSize: fontSize,
            mouseWheelZoom: true, // 启用鼠标滚轮缩放
            autoSurround: "never", // 是否应自动环绕选择
            cursorBlinking: "smooth", // 光标动画样式
            cursorSmoothCaretAnimation: "on", // 是否启用光标平滑插入动画  当你在快速输入文字的时候 光标是直接平滑的移动还是直接"闪现"到当前文字所处位置
            cursorStyle: "line", //  光标样式
            cursorSurroundingLines: 0, // 光标环绕行数 当文字输入超过屏幕时 可以看见右侧滚动条中光标所处位置是在滚动条中间还是顶部还是底部 即光标环绕行数 环绕行数越大 光标在滚动条中位置越居中
            cursorSurroundingLinesStyle: "all", // "default" | "all" 光标环绕样式
            scrollBeyondLastLine: false, // 不允许编辑器滚动到最后一行
          },
        );
      } else if (aiEditorRef.current) {
        // 不设置AI编辑器的值
      }

      // 更新编辑器布局
      editorRef.current?.layout();
      aiEditorRef.current?.layout();

      // 使用OpenAI服务
      const openAiService = OpenAIService.createInstance();

      // 准备消息内容
      const originalText = originalEditorRef.current?.getValue() || "";
      const modifiedText = modifiedEditorRef.current?.getValue() || "";
      const diffContent = `原始内容:\n\`\`\`json\n${originalText}\n\`\`\`\n\n修改后内容:\n\`\`\`json\n${modifiedText}\n\`\`\``;

      // 修复TypeScript类型问题，确保与ChatCompletionMessageParam兼容
      const messages = [
        {
          role: "system" as const,
          content:
            "您是一个JSON DIFF差异化比较工具助手，请帮助用户解决JSON相关问题，返回数据或代码并使用\\`\\`\\`语言标记\\`\\`\\`包裹，请输出数据再会回复说明。",
        },
        {
          role: "user" as const,
          content: `${aiPrompt}\n\n以下是用户的差异化比较JSON数据:\n${diffContent}`,
        },
      ];

      if (messages[1].content.length > openAiService.maxTokens) {
        toast.error("内容超出限制，请缩短内容或使用其他方式描述需求。");
        setIsAiLoading(false);

        return;
      }

      try {
        // 检查是否已取消
        if (controller.signal.aborted) {
          return;
        }

        await openAiService.createChatCompletion(messages, {
          onStart: () => {
            // 不要在这里写入编辑器内容
          },
          onChunk: (_chunk, accumulated) => {
            // 检查是否已取消
            if (controller.signal.aborted) {
              throw new Error("已取消生成");
            }
            if (aiEditorRef.current) {
              aiEditorRef.current.setValue(accumulated);
            }
          },
          onComplete: (final) => {
            // 提取语言标记
            const langMatch = final.match(/^```([a-z]+)\s/i);
            let detectedLang = langMatch ? langMatch[1].toLowerCase() : "json";

            if (!detectedLang) {
              detectedLang = "yaml";
            }

            // 清理结果，移除所有的 markdown 代码标记
            const cleanedResult = final
              .replace(/```[\s\S]*?```/g, function (match) {
                // 提取代码块内容，去除首尾的 ``` 和语言标记
                return match
                  .replace(/^```[a-z]*\s*/i, "")
                  .replace(/```\s*$/i, "");
              })
              .trim();

            // 完成时一次性更新编辑器内容
            setTimeout(() => {
              const model = monaco.editor.createModel(
                cleanedResult as string,
                detectedLang || "json",
              );

              if (aiEditorRef.current) {
                aiEditorRef.current.setModel(model);
              }
            }, 100);

            setIsAiLoading(false);
            // 清除控制器引用
            (window as any).currentAiController = null;
          },
          onError: (error) => {
            setIsAiLoading(false);
            // 如果是取消错误，显示不同的消息
            if (error.message === "已取消生成") {
              toast.warning(`AI解析已取消`);
              // 不要修改AI编辑器内容
            } else {
              toast.error(`AI回复错误: ${error.message}`);
              // 不要修改AI编辑器内容
            }
            // 清除控制器引用
            (window as any).currentAiController = null;
          },
        });
      } catch (error) {
        setIsAiLoading(false);
        // 清除控制器引用
        (window as any).currentAiController = null;
      }
    }, 500); // 给UI足够的时间渲染编辑器容器
  };

  // 停止AI解析
  const stopAiGeneration = () => {
    // 获取控制器并中止请求
    const controller = (window as any).currentAiController as AbortController;

    if (controller) {
      controller.abort();
      // 更新状态
      setIsAiLoading(false);
      toast.success("已停止AI解析");
      // 不再清空或修改AI编辑器的内容
    }
  };

  // 关闭AI响应
  const closeAiResponse = useCallback(() => {
    // 先设置状态为隐藏
    setShowAiResponse(false);

    // 使用过渡动画的时间后再清理相关状态
    setTimeout(() => {
      // 调整编辑器布局
      editorRef.current?.layout();
    }, 300);
  }, []);

  const formatEditorAction = (
    editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>,
  ) => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  };

  const editorFormat = (type: MonacoDiffEditorEditorType): boolean => {
    switch (type) {
      case MonacoDiffEditorEditorType.left:
        formatEditorAction(originalEditorRef);
        break;
      case MonacoDiffEditorEditorType.right:
        formatEditorAction(modifiedEditorRef);
        break;
      case MonacoDiffEditorEditorType.all:
        formatEditorAction(originalEditorRef);
        formatEditorAction(modifiedEditorRef);
        break;
      default:
        console.log("unknown type", type);

        return false;
    }

    return true;
  };

  // 设置编辑器内容，保留历史, 支持 ctrl + z 撤销
  const setEditorValue = (
    editor: editor.IStandaloneCodeEditor | null,
    jsonText: string,
  ) => {
    if (!editor) {
      return;
    }
    const model = editor.getModel();

    if (!model) {
      return;
    }
    editor.executeEdits("", [
      {
        range: model.getFullModelRange(),
        text: jsonText,
        forceMoveMarkers: true,
      },
    ]);
  };
  const clearEditor = (
    editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>,
  ) => {
    setEditorValue(editorRef.current, "");
  };

  const sortEditor = (
    editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>,
    sort: "asc" | "desc",
  ): boolean => {
    const val = editorRef.current!.getValue();

    if (!val) {
      return false;
    }

    try {
      const jsonObj = JSON.parse(val);

      setEditorValue(editorRef.current, sortJson(jsonObj, sort));

      return true;
    } catch {
      return false;
    }
  };

  // 复制到剪贴板
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    updateOriginalValue: (value: string) => {
      setEditorValue(originalEditorRef.current, value);
    },
    updateModifiedValue: (value: string) => {
      setEditorValue(modifiedEditorRef.current, value);
    },
    focus: () => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    },
    layout: () => {
      if (editorRef.current) {
        editorRef.current.layout();
        originalEditorRef.current?.layout();
        modifiedEditorRef.current?.layout();
      }
      if (aiEditorRef.current) {
        aiEditorRef.current?.layout();
      }
    },
    showAiPrompt: () => {
      setShowAiPrompt(true);
    },
    copy: (type) => {
      if (!editorRef.current) {
        return false;
      }

      let val = "";

      if (type === MonacoDiffEditorEditorType.left) {
        val = originalEditorRef.current!.getValue();
      } else if (type === MonacoDiffEditorEditorType.right) {
        val = modifiedEditorRef.current!.getValue();
      }

      copyText(val);
      toast.success("复制成功");

      return true;
    },
    format: (type) => {
      if (type === undefined) {
        return false;
      }

      const ok = editorFormat(type);

      if (!ok) {
        toast.error("格式化失败，请检查JSON格式是否正确");

        return false;
      }
      toast.success("格式化成功");

      return ok;
    },
    clear: (type) => {
      if (!editorRef.current) {
        return false;
      }
      switch (type) {
        case MonacoDiffEditorEditorType.left:
          clearEditor(originalEditorRef);
          break;
        case MonacoDiffEditorEditorType.right:
          clearEditor(modifiedEditorRef);
          break;
        case MonacoDiffEditorEditorType.all:
          clearEditor(originalEditorRef);
          clearEditor(modifiedEditorRef);
          break;
        default:
          return false;
      }
      toast.success("清空成功");

      return true;
    },
    fieldSort: (type, sort): boolean => {
      if (!editorRef.current || type === undefined || sort === undefined) {
        return false;
      }
      let ok = false;

      switch (type) {
        case MonacoDiffEditorEditorType.left:
          ok = sortEditor(originalEditorRef, sort);
          break;
        case MonacoDiffEditorEditorType.right:
          ok = sortEditor(modifiedEditorRef, sort);
          break;
        case MonacoDiffEditorEditorType.all:
          ok = sortEditor(originalEditorRef, sort);
          ok = sortEditor(modifiedEditorRef, sort);
          break;
        default:
          return false;
      }

      if (!ok) {
        toast.error("JSON格式错误，请检查后重试");

        return false;
      }

      toast.success("排序成功");

      return true;
    },
  }));

  // 更新编辑器选项
  const updateEditorOptions = (options: editor.IEditorOptions) => {
    if (editorRef.current) {
      editorRef.current.updateOptions(options);
      originalEditorRef.current?.updateOptions(options);
      modifiedEditorRef.current?.updateOptions(options);
    }
  };

  return (
    <div className="flex flex-col w-full h-full relative" style={{ height }}>
      {/* 使用AIPromptOverlay组件 */}
      <AIPromptOverlay
        isLoading={isAiLoading}
        isOpen={showAiPrompt}
        placeholderText="向AI提问关于当前JSON比较的问题..."
        prompt={aiPrompt}
        onClose={() => setShowAiPrompt(false)}
        onPromptChange={setAiPrompt}
        onSubmit={handleAiSubmit}
      />

      {/* 编辑器外层容器 */}
      <div
        ref={editorContainerRef}
        className={cn("w-full flex-grow relative")}
        style={{
          height: showAiResponse ? `calc(100% - ${aiPanelHeight}px)` : "100%",
          transition: isDragging ? "none" : "height 0.3s ease-out",
        }}
      >
        {/* 添加 DraggableMenu 组件 */}
        <DraggableMenu
          containerRef={editorContainerRef}
          currentFontSize={fontSize}
          currentLanguage={currentLanguage}
          tabKey={tabKey}
          onFontSizeChange={setFontSize}
          onLanguageChange={setCurrentLanguage}
          onReset={() => {
            setFontSize(14);
            setCurrentLanguage("json");
          }}
        />
      </div>

      {/* AI响应面板 - 从底部推出 */}
      <div
        ref={aiPanelRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg transition-transform duration-300 ease-out",
          showAiResponse ? "translate-y-0" : "translate-y-full",
          isDragging ? "transition-none" : "",
        )}
        style={{
          height: `${aiPanelHeight}px`,
          zIndex: showAiResponse ? 1000 : -1,
          pointerEvents: showAiResponse ? "auto" : "none",
          opacity: showAiResponse ? 1 : 0,
          visibility: showAiResponse ? "visible" : "hidden",
          transition: isDragging
            ? "none"
            : "transform 0.3s ease-out, opacity 0.3s, visibility 0.3s",
        }}
      >
        {/* 拖动条 - 样式优化 */}
        <div
          aria-label="拖动调整AI面板高度"
          className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize bg-gradient-to-r from-blue-100 via-indigo-100 to-blue-100 dark:from-neutral-800/80   border-none outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center"
          role="button"
          style={{
            touchAction: "none",
            WebkitTapHighlightColor: "transparent",
          }}
          tabIndex={0}
          onKeyDown={(e) => {
            // 支持键盘操作
            if (e.key === "ArrowUp") {
              const newHeight = Math.max(100, aiPanelHeight - 50);

              setAiPanelHeight(newHeight);

              // 同时更新DOM元素以避免状态更新延迟
              if (aiPanelRef.current) {
                aiPanelRef.current.style.height = `${newHeight}px`;
              }
              if (editorContainerRef.current) {
                editorContainerRef.current.style.height = `calc(100% - ${newHeight}px)`;
              }

              aiEditorRef.current?.layout();
              editorRef.current?.layout();
            } else if (e.key === "ArrowDown") {
              const newHeight = Math.min(
                window.innerHeight * 0.8,
                aiPanelHeight + 50,
              );

              setAiPanelHeight(newHeight);

              // 同时更新DOM元素以避免状态更新延迟
              if (aiPanelRef.current) {
                aiPanelRef.current.style.height = `${newHeight}px`;
              }
              if (editorContainerRef.current) {
                editorContainerRef.current.style.height = `calc(100% - ${newHeight}px)`;
              }

              aiEditorRef.current?.layout();
              editorRef.current?.layout();
            }
          }}
          onMouseDown={handleDragStart}
        >
          <div className="w-16 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* AI面板标题栏 */}
        <div className="flex justify-between items-center px-3 py-2.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-blue-50/80 dark:from-neutral-800/80  border-b border-blue-100 dark:border-neutral-800 mt-3">
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <Icon
                className="text-indigo-600 dark:text-indigo-400"
                icon="hugeicons:ai-chat-02"
                width={20}
              />
              {isAiLoading && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-500 animate-ping" />
              )}
            </div>
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              {isAiLoading ? "AI正在思考中..." : "AI助手解析结果"}
            </span>
            {isAiLoading && (
              <div className="flex items-center space-x-1 ml-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse delay-150" />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse delay-300" />
              </div>
            )}
          </div>
          <div className="flex space-x-1.5">
            {isAiLoading && (
              <Button
                isIconOnly
                className="bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-800/40 rounded-full"
                size="sm"
                title="停止生成"
                variant="flat"
                onPress={stopAiGeneration}
              >
                <Icon icon="tabler:player-stop-filled" width={16} />
              </Button>
            )}
            {!isAiLoading && (
              <Button
                isIconOnly
                className="bg-indigo-50 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-800/40 rounded-full"
                size="sm"
                title="重新生成"
                variant="flat"
                onPress={() => handleAiSubmit()}
              >
                <Icon icon="tabler:refresh" width={16} />
              </Button>
            )}
            <Button
              isIconOnly
              className="bg-blue-50 text-indigo-500 hover:text-indigo-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-blue-800/40 rounded-full"
              size="sm"
              title="复制内容"
              variant="flat"
              onPress={() => {
                if (aiEditorRef.current) {
                  const content = aiEditorRef.current.getValue();

                  navigator.clipboard.writeText(content);
                  toast.success("已复制内容");
                }
              }}
            >
              <Icon icon="lucide:copy" width={16} />
            </Button>
            <Button
              isIconOnly
              className="bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50 rounded-full"
              size="sm"
              title="关闭AI助手结果"
              variant="flat"
              onPress={closeAiResponse}
            >
              <Icon icon="mdi:close" width={16} />
            </Button>
          </div>
        </div>

        {/* AI编辑器容器 */}
        <div
          ref={aiContainerRef}
          className="flex-1 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden"
          style={{
            height: "calc(100% - 55px)",
            transform: "translateZ(0)", // 强制创建合成层，提高性能
          }}
        />
      </div>
    </div>
  );
};

MonacoDiffEditor.displayName = "MonacoDiffEditor";

export default MonacoDiffEditor;
