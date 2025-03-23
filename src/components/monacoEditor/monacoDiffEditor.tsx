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
import { AIResultHeader } from "./AIResultHeader";
import PromptContainer, {
  PromptContainerRef,
} from "@/components/ai/PromptContainer";

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
  const [showAiResponse, setShowAiResponse] = useState(false);
  const [aiMessages, setAiMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: number }>
  >([]);
  
  // 添加编辑器内容状态，用于传递给PromptContainer
  const [editorContent, setEditorContent] = useState("");
  
  // 添加一个引用以便访问PromptContainer组件的方法
  const promptContainerRef = useRef<PromptContainerRef>(null);
  
  const aiPanelRef = useRef<HTMLDivElement>(null);
  const [aiPanelHeight, setAiPanelHeight] = useState<number>(
    typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.8) : 500
  ); // 默认高度为窗口高度的80%
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

  // 监听原始编辑器内容变化
  useEffect(() => {
    if (originalEditorRef.current && modifiedEditorRef.current) {
      // 更新编辑器内容状态
      const originalText = originalEditorRef.current.getValue() || "";
      const modifiedText = modifiedEditorRef.current.getValue() || "";
      setEditorContent(`原始内容:\n${originalText}\n\n修改后内容:\n${modifiedText}`);
    }
  }, [originalValue, modifiedValue]);

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
      editorRef.current?.layout();
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

  // 监听窗口大小变化，调整AI面板高度
  useEffect(() => {
    const handleResize = () => {
      // 如果用户没有手动调整过高度，则自动调整为窗口高度的80%
      if (!isDragging && showAiResponse) {
        const newHeight = Math.min(
          Math.floor(window.innerHeight * 0.8),
          window.innerHeight - 100 // 确保至少留出100px给编辑器
        );
        
        // 直接更新DOM以避免状态更新延迟
        if (aiPanelRef.current) {
          aiPanelRef.current.style.height = `${newHeight}px`;
        }
        if (editorContainerRef.current) {
          editorContainerRef.current.style.height = `calc(100% - ${newHeight}px)`;
        }
        
        // 同步状态
        setAiPanelHeight(newHeight);
        
        // 请求布局更新
        editorRef.current?.layout();
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isDragging, showAiResponse]);

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
          const originalText = originalEditorRef.current!.getValue();
          onUpdateOriginalValue(originalText);
          
          // 更新编辑器内容状态
          if (modifiedEditorRef.current) {
            const modifiedText = modifiedEditorRef.current.getValue() || "";
            setEditorContent(`原始内容:\n${originalText}\n\n修改后内容:\n${modifiedText}`);
          }
        });

        // 监听修改编辑器内容变化
        modifiedEditorRef.current.onDidChangeModelContent(() => {
          const modifiedText = modifiedEditorRef.current!.getValue();
          onUpdateModifiedValue && onUpdateModifiedValue(modifiedText);
          
          // 更新编辑器内容状态
          if (originalEditorRef.current) {
            const originalText = originalEditorRef.current.getValue() || "";
            setEditorContent(`原始内容:\n${originalText}\n\n修改后内容:\n${modifiedText}`);
          }
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

    setShowAiPrompt(false);
    setShowAiResponse(true);

    // 设置面板高度为窗口高度的80%
    const panelHeight = Math.min(
      Math.floor(window.innerHeight * 0.8),
      window.innerHeight - 100
    );
    setAiPanelHeight(panelHeight);
    
    // 直接更新DOM元素
    if (aiPanelRef.current) {
      aiPanelRef.current.style.height = `${panelHeight}px`;
    }
    if (editorContainerRef.current) {
      editorContainerRef.current.style.height = `calc(100% - ${panelHeight}px)`;
    }

    // 添加用户消息到消息数组
    const userMessage = {
      role: "user" as const,
      content: aiPrompt,
      timestamp: Date.now(),
    };

    setAiMessages((prev) => [...prev, userMessage]);

    // 保存prompt内容用于稍后发送
    const promptToSend = aiPrompt;

    setAiPrompt("");

    // 更新布局
    setTimeout(() => {
      editorRef.current?.layout();
      
      // 在提交前再次更新编辑器内容
      if (originalEditorRef.current && modifiedEditorRef.current) {
        const originalText = originalEditorRef.current.getValue() || "";
        const modifiedText = modifiedEditorRef.current.getValue() || "";
        setEditorContent(`原始内容:\n${originalText}\n\n修改后内容:\n${modifiedText}`);
      }
      
      // 触发编辑器布局更新

      // 使用setTimeout确保PromptContainer组件已经挂载并初始化
      setTimeout(() => {
        // 直接触发PromptContainer的sendMessage方法
        if (promptContainerRef.current) {
          promptContainerRef.current.sendMessage(promptToSend);
        } else {
          // 如果还没有获取到ref，添加一个思考中的消息
          setAiMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "思考中...",
              timestamp: Date.now(),
            },
          ]);
        }
      }, 100);
    }, 300);
  };

  // 关闭AI响应
  const closeAiResponse = useCallback(() => {
    setShowAiResponse(false);
    // 清空消息历史
    setAiMessages([]);

    // 布局调整
    setTimeout(() => {
      editorRef.current?.layout();
    }, 100);
  }, []);

  // 处理关闭按钮的函数
  const handleCloseAiResponse = () => {
    closeAiResponse();
  };

  // 添加应用代码到编辑器的函数
  const handleApplyCode = (code: string) => {
    if (!code || !editorRef.current) {
      toast.error("无法应用代码到编辑器");
      return;
    }

    try {
      // 尝试解析JSON，确保是有效的JSON
      const jsonObj = JSON.parse(code);

      // 如果解析成功，格式化并设置到编辑器
      if (modifiedEditorRef.current) {
        setEditorValue(modifiedEditorRef.current, JSON.stringify(jsonObj, null, 2));
        toast.success("已应用代码到编辑器");
      }
    } catch (error) {
      // 如果解析失败，尝试直接设置文本
      try {
        if (modifiedEditorRef.current) {
          setEditorValue(modifiedEditorRef.current, code);
          toast.success("已应用代码到编辑器");
        }
      } catch (e) {
        toast.error("应用代码失败，格式可能不正确");
      }
    }
  };

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
          "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg transition-transform duration-300 ease-out rounded-t-lg",
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
        {/* 拖动条 - 面板内部顶部 */}
        <div
          aria-label="拖动调整AI面板高度"
          className="w-full h-7 cursor-ns-resize bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-800 border-b border-blue-200 dark:border-neutral-700 rounded-t-lg flex items-center justify-center"
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

              editorRef.current?.layout();
            }
          }}
          onMouseDown={handleDragStart}
        >
          <div className="w-32 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* AI面板内容 */}
        <div className="flex flex-col h-[calc(100%-7px)] overflow-hidden">
          {/* AI标题栏 */}
          <AIResultHeader onClose={handleCloseAiResponse} />

          {/* AI对话区域 */}
          <div className="flex-1 h-full overflow-hidden">
            <PromptContainer
              ref={promptContainerRef}
              className="h-full"
              editorContent={editorContent}
              initialMessages={aiMessages}
              showAttachButtons={false}
              useDirectApi={true}
              onApplyCode={handleApplyCode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

MonacoDiffEditor.displayName = "MonacoDiffEditor";

export default MonacoDiffEditor;
