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

import { AIResultHeader } from "./AIResultHeader";

import toast from "@/utils/toast";
import { MonacoDiffEditorEditorType } from "@/components/monacoEditor/monacoEntity";
import { sortJson } from "@/utils/json";
import { useTabStore } from "@/store/useTabStore";
import DraggableMenu from "@/components/monacoEditor/DraggableMenu.tsx";
import AIPromptOverlay, { QuickPrompt } from "@/components/ai/AIPromptOverlay";
import PromptContainer, {
  PromptContainerRef,
} from "@/components/ai/PromptContainer";
import {
  TimestampDecoratorState,
  clearTimestampCache,
  toggleTimestampDecorators,
  updateTimestampDecorations,
  handleTimestampContentChange,
} from "@/components/monacoEditor/decorations/timestampDecoration.ts";
import {
  Base64DecoratorState,
  updateBase64Decorations,
  handleBase64ContentChange,
  setBase64DecorationEnabled,
  setBase64ProviderEnabled,
} from "@/components/monacoEditor/decorations/base64Decoration.ts";
import {
  UnicodeDecoratorState,
  updateUnicodeDecorations,
  handleUnicodeContentChange,
  setUnicodeDecorationEnabled,
  setUnicodeProviderEnabled,
} from "@/components/monacoEditor/decorations/unicodeDecoration.ts";

import "@/styles/monaco.css";
import { Json5LanguageDef } from "@/components/monacoEditor/MonacoLanguageDef.tsx";
import { diffJsonQuickPrompts } from "@/components/ai/JsonQuickPrompts.tsx";

export interface MonacoDiffEditorProps {
  tabKey: string;
  tabTitle?: string;
  height?: number | string;
  originalValue: string;
  modifiedValue: string;
  language?: string;
  theme?: string;
  customQuickPrompts?: QuickPrompt[];
  showTimestampDecorators?: boolean;
  showBase64Decorators?: boolean;
  showUnicodeDecorators?: boolean;
  onUpdateOriginalValue: (value: string) => void;
  onUpdateModifiedValue?: (value: string) => void;
  onMount?: () => void;

  ref?: React.Ref<MonacoDiffEditorRef>;
}

export interface MonacoDiffEditorRef {
  clear: (type?: MonacoDiffEditorEditorType) => boolean;
  copy: (type?: MonacoDiffEditorEditorType) => boolean;
  fieldSort: (
    type?: MonacoDiffEditorEditorType,
    sort?: "asc" | "desc",
  ) => boolean;
  focus: () => void;
  format: (type?: MonacoDiffEditorEditorType) => boolean;
  layout: () => void;
  showAiPrompt: () => void;
  updateModifiedValue: (value: string) => void;
  updateOriginalValue: (value: string) => void;
  toggleTimestampDecorators: (enabled?: boolean) => boolean;
  toggleBase64Decorators: (enabled?: boolean) => boolean;
  toggleUnicodeDecorators: (enabled?: boolean) => boolean;
}

const MonacoDiffEditor: React.FC<MonacoDiffEditorProps> = ({
  originalValue,
  modifiedValue,
  language,
  theme,
  height,
  tabKey,
  customQuickPrompts,
  showTimestampDecorators = true,
  showBase64Decorators = true,
  showUnicodeDecorators = true,
  onUpdateOriginalValue,
  onUpdateModifiedValue,
  onMount,
  ref,
}) => {
  const { getTabByKey, updateEditorSettings } = useTabStore();
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const originalEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const modifiedEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // 从 store 获取当前 tab 的设置
  const currentTab = getTabByKey(tabKey);
  const editorSettings = currentTab?.editorSettings || {
    fontSize: 14,
    language: language || "json",
    timestampDecoratorsEnabled: showTimestampDecorators,
    base64DecoratorsEnabled: showBase64Decorators,
    unicodeDecoratorsEnabled: showUnicodeDecorators,
  };

  // 菜单状态
  const [currentLanguage, setCurrentLanguage] = useState(
    editorSettings.language,
  );
  const [fontSize, setFontSize] = useState(editorSettings.fontSize);

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
    typeof window !== "undefined" ? Math.floor(window.innerHeight * 0.8) : 500,
  ); // 默认高度为窗口高度的80%
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);

  // 时间戳装饰器相关引用
  // 为原始编辑器和修改后编辑器分别创建装饰器状态
  const originalTimestampDecorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const originalTimestampDecorationIdsRef = useRef<Record<string, string[]>>(
    {},
  );
  const originalTimestampUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const originalTimestampCacheRef = useRef<Record<string, boolean>>({});

  const modifiedTimestampDecorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const modifiedTimestampDecorationIdsRef = useRef<Record<string, string[]>>(
    {},
  );
  const modifiedTimestampUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modifiedTimestampCacheRef = useRef<Record<string, boolean>>({});

  // 时间戳装饰器启用状态，优先从编辑器设置中读取
  const [timestampDecoratorsEnabled, setTimestampDecoratorsEnabled] = useState(
    editorSettings.timestampDecoratorsEnabled !== undefined
      ? editorSettings.timestampDecoratorsEnabled
      : showTimestampDecorators,
  );

  // Base64下划线装饰器启用状态，优先从编辑器设置中读取
  const [base64DecoratorsEnabled, setBase64DecoratorsEnabled] = useState(
    editorSettings.base64DecoratorsEnabled !== undefined
      ? editorSettings.base64DecoratorsEnabled
      : showBase64Decorators,
  );

  // Unicode装饰器启用状态，优先从编辑器设置中读取
  const [unicodeDecoratorsEnabled, setUnicodeDecoratorsEnabled] = useState(
    editorSettings.unicodeDecoratorsEnabled !== undefined
      ? editorSettings.unicodeDecoratorsEnabled
      : showUnicodeDecorators,
  );

  // 时间戳装饰器状态
  const originalTimestampDecoratorState: TimestampDecoratorState = {
    editorRef: originalEditorRef,
    decorationsRef: originalTimestampDecorationsRef,
    decorationIdsRef: originalTimestampDecorationIdsRef,
    updateTimeoutRef: originalTimestampUpdateTimeoutRef,
    cacheRef: originalTimestampCacheRef,
    enabled: timestampDecoratorsEnabled,
  };

  const modifiedTimestampDecoratorState: TimestampDecoratorState = {
    editorRef: modifiedEditorRef,
    decorationsRef: modifiedTimestampDecorationsRef,
    decorationIdsRef: modifiedTimestampDecorationIdsRef,
    updateTimeoutRef: modifiedTimestampUpdateTimeoutRef,
    cacheRef: modifiedTimestampCacheRef,
    enabled: timestampDecoratorsEnabled,
  };

  // Base64下划线装饰器相关引用
  const originalBase64DecorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const originalBase64DecorationIdsRef = useRef<Record<string, string[]>>({});
  const originalBase64UpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const originalBase64CacheRef = useRef<Record<string, boolean>>({});

  const modifiedBase64DecorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const modifiedBase64DecorationIdsRef = useRef<Record<string, string[]>>({});
  const modifiedBase64UpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modifiedBase64CacheRef = useRef<Record<string, boolean>>({});

  // Unicode下划线装饰器相关引用
  const originalUnicodeDecorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const originalUnicodeDecorationIdsRef = useRef<Record<string, string[]>>({});
  const originalUnicodeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const originalUnicodeCacheRef = useRef<Record<string, boolean>>({});

  const modifiedUnicodeDecorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const modifiedUnicodeDecorationIdsRef = useRef<Record<string, string[]>>({});
  const modifiedUnicodeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modifiedUnicodeCacheRef = useRef<Record<string, boolean>>({});

  // Base64下划线装饰器状态
  const originalBase64DecoratorState: Base64DecoratorState = {
    editorRef: originalEditorRef,
    decorationsRef: originalBase64DecorationsRef,
    decorationIdsRef: originalBase64DecorationIdsRef,
    hoverProviderId: { current: null },
    cacheRef: originalBase64CacheRef,
    updateTimeoutRef: originalBase64UpdateTimeoutRef,
    enabled: base64DecoratorsEnabled,
  };

  const modifiedBase64DecoratorState: Base64DecoratorState = {
    editorRef: modifiedEditorRef,
    decorationsRef: modifiedBase64DecorationsRef,
    decorationIdsRef: modifiedBase64DecorationIdsRef,
    hoverProviderId: { current: null },
    cacheRef: modifiedBase64CacheRef,
    updateTimeoutRef: modifiedBase64UpdateTimeoutRef,
    enabled: base64DecoratorsEnabled,
  };

  // Unicode下划线装饰器状态
  const originalUnicodeDecoratorState: UnicodeDecoratorState = {
    editorRef: originalEditorRef,
    decorationsRef: originalUnicodeDecorationsRef,
    decorationIdsRef: originalUnicodeDecorationIdsRef,
    hoverProviderId: { current: null },
    cacheRef: originalUnicodeCacheRef,
    updateTimeoutRef: originalUnicodeUpdateTimeoutRef,
    enabled: unicodeDecoratorsEnabled,
  };

  const modifiedUnicodeDecoratorState: UnicodeDecoratorState = {
    editorRef: modifiedEditorRef,
    decorationsRef: modifiedUnicodeDecorationsRef,
    decorationIdsRef: modifiedUnicodeDecorationIdsRef,
    hoverProviderId: { current: null },
    cacheRef: modifiedUnicodeCacheRef,
    updateTimeoutRef: modifiedUnicodeUpdateTimeoutRef,
    enabled: unicodeDecoratorsEnabled,
  };

  // 使用自定义快捷指令或默认快捷指令
  const finalQuickPrompts = customQuickPrompts || diffJsonQuickPrompts;

  // 监听时间戳装饰器状态变化
  useEffect(() => {
    // 更新状态对象中的启用状态
    originalTimestampDecoratorState.enabled = timestampDecoratorsEnabled;
    modifiedTimestampDecoratorState.enabled = timestampDecoratorsEnabled;

    if (timestampDecoratorsEnabled) {
      // 清空缓存并更新装饰器
      clearTimestampCache(originalTimestampDecoratorState);
      clearTimestampCache(modifiedTimestampDecoratorState);
      setTimeout(() => {
        if (originalEditorRef.current) {
          updateTimestampDecorations(
            originalEditorRef.current,
            originalTimestampDecoratorState,
          );
        }
        if (modifiedEditorRef.current) {
          updateTimestampDecorations(
            modifiedEditorRef.current,
            modifiedTimestampDecoratorState,
          );
        }
      }, 0);
    } else {
      // 禁用时清理缓存和装饰器
      if (originalTimestampDecorationsRef.current) {
        originalTimestampDecorationsRef.current.clear();
      }
      if (modifiedTimestampDecorationsRef.current) {
        modifiedTimestampDecorationsRef.current.clear();
      }
      clearTimestampCache(originalTimestampDecoratorState);
      clearTimestampCache(modifiedTimestampDecoratorState);
    }
  }, [timestampDecoratorsEnabled]);

  // 监听Base64下划线装饰器状态变化
  useEffect(() => {
    // 更新状态对象中的启用状态
    originalBase64DecoratorState.enabled = base64DecoratorsEnabled;
    modifiedBase64DecoratorState.enabled = base64DecoratorsEnabled;

    // 更新全局状态
    setBase64ProviderEnabled(base64DecoratorsEnabled);
    setBase64DecorationEnabled(base64DecoratorsEnabled);

    if (base64DecoratorsEnabled) {
      // 清空缓存并更新装饰器
      if (originalBase64CacheRef.current) {
        originalBase64CacheRef.current = {};
      }
      if (modifiedBase64CacheRef.current) {
        modifiedBase64CacheRef.current = {};
      }
      setTimeout(() => {
        if (originalEditorRef.current) {
          updateBase64Decorations(
            originalEditorRef.current,
            originalBase64DecoratorState,
          );
        }
        if (modifiedEditorRef.current) {
          updateBase64Decorations(
            modifiedEditorRef.current,
            modifiedBase64DecoratorState,
          );
        }
      }, 0);
    } else {
      // 禁用时清理装饰器
      if (originalBase64DecorationsRef.current) {
        originalBase64DecorationsRef.current.clear();
      }
      if (modifiedBase64DecorationsRef.current) {
        modifiedBase64DecorationsRef.current.clear();
      }
      if (originalBase64CacheRef.current) {
        originalBase64CacheRef.current = {};
      }
      if (modifiedBase64CacheRef.current) {
        modifiedBase64CacheRef.current = {};
      }
    }
  }, [base64DecoratorsEnabled]);

  // 监听Unicode装饰器状态变化
  useEffect(() => {
    // 更新状态对象中的启用状态
    originalUnicodeDecoratorState.enabled = unicodeDecoratorsEnabled;
    modifiedUnicodeDecoratorState.enabled = unicodeDecoratorsEnabled;

    // 更新全局状态
    setUnicodeProviderEnabled(unicodeDecoratorsEnabled);
    setUnicodeDecorationEnabled(unicodeDecoratorsEnabled);

    if (unicodeDecoratorsEnabled) {
      // 清空缓存并更新装饰器
      if (originalUnicodeCacheRef.current) {
        originalUnicodeCacheRef.current = {};
      }
      if (modifiedUnicodeCacheRef.current) {
        modifiedUnicodeCacheRef.current = {};
      }
      setTimeout(() => {
        if (originalEditorRef.current) {
          updateUnicodeDecorations(
            originalEditorRef.current,
            originalUnicodeDecoratorState,
          );
        }
        if (modifiedEditorRef.current) {
          updateUnicodeDecorations(
            modifiedEditorRef.current,
            modifiedUnicodeDecoratorState,
          );
        }
      }, 0);
    } else {
      // 禁用时清理装饰器
      if (originalUnicodeDecorationsRef.current) {
        originalUnicodeDecorationsRef.current.clear();
      }
      if (modifiedUnicodeDecorationsRef.current) {
        modifiedUnicodeDecorationsRef.current.clear();
      }
      if (originalUnicodeCacheRef.current) {
        originalUnicodeCacheRef.current = {};
      }
      if (modifiedUnicodeCacheRef.current) {
        modifiedUnicodeCacheRef.current = {};
      }
    }
  }, [unicodeDecoratorsEnabled]);

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

      setEditorContent(
        `原始内容:\n${originalText}\n\n修改后内容:\n${modifiedText}`,
      );
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
          window.innerHeight - 100, // 确保至少留出100px给编辑器
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

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isDragging, showAiResponse]);

  // 创建差异编辑器实例
  async function createDiffEditor() {
    loader.config({ monaco });

    loader.init().then((monacoInstance) => {
      // 注册 JSON5 语言支持
      if (
        !monacoInstance.languages
          .getLanguages()
          .some((lang) => lang.id === "json5")
      ) {
        monacoInstance.languages.register({ id: "json5" });
        monacoInstance.languages.setMonarchTokensProvider(
          "json5",
          Json5LanguageDef,
        );
      }

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
        originalEditorRef.current.onDidChangeModelContent((e) => {
          const originalText = originalEditorRef.current!.getValue();

          onUpdateOriginalValue(originalText);

          // 更新编辑器内容状态
          if (modifiedEditorRef.current) {
            const modifiedText = modifiedEditorRef.current.getValue() || "";

            setEditorContent(
              `原始内容:\n${originalText}\n\n修改后内容:\n${modifiedText}`,
            );
          }

          // 更新时间戳装饰器
          if (timestampDecoratorsEnabled) {
            handleTimestampContentChange(e, originalTimestampDecoratorState);
          }

          // 更新Base64下划线装饰器
          if (base64DecoratorsEnabled) {
            handleBase64ContentChange(e, originalBase64DecoratorState);
          }

          // Unicode下划线装饰器
          if (unicodeDecoratorsEnabled) {
            handleUnicodeContentChange(e, originalUnicodeDecoratorState);
          }
        });

        // 监听修改编辑器内容变化
        modifiedEditorRef.current.onDidChangeModelContent((e) => {
          const modifiedText = modifiedEditorRef.current!.getValue();

          onUpdateModifiedValue && onUpdateModifiedValue(modifiedText);

          // 更新编辑器内容状态
          if (originalEditorRef.current) {
            const originalText = originalEditorRef.current.getValue() || "";

            setEditorContent(
              `原始内容:\n${originalText}\n\n修改后内容:\n${modifiedText}`,
            );
          }

          // 更新时间戳装饰器
          if (timestampDecoratorsEnabled) {
            handleTimestampContentChange(e, modifiedTimestampDecoratorState);
          }

          // 更新Base64下划线装饰器
          if (base64DecoratorsEnabled) {
            handleBase64ContentChange(e, modifiedBase64DecoratorState);
          }

          // Unicode下划线装饰器
          if (unicodeDecoratorsEnabled) {
            handleUnicodeContentChange(e, modifiedUnicodeDecoratorState);
          }
        });

        // 监听滚动事件
        originalEditorRef.current.onDidScrollChange(() => {
          if (originalTimestampUpdateTimeoutRef.current) {
            clearTimeout(originalTimestampUpdateTimeoutRef.current);
          }

          originalTimestampUpdateTimeoutRef.current = setTimeout(() => {
            if (originalEditorRef.current && timestampDecoratorsEnabled) {
              updateTimestampDecorations(
                originalEditorRef.current,
                originalTimestampDecoratorState,
              );
            }
          }, 200); // 添加防抖

          if (originalBase64UpdateTimeoutRef.current) {
            clearTimeout(originalBase64UpdateTimeoutRef.current);
          }

          originalBase64UpdateTimeoutRef.current = setTimeout(() => {
            if (originalEditorRef.current && base64DecoratorsEnabled) {
              updateBase64Decorations(
                originalEditorRef.current,
                originalBase64DecoratorState,
              );
            }
          }, 200);

          if (originalUnicodeUpdateTimeoutRef.current) {
            clearTimeout(originalUnicodeUpdateTimeoutRef.current);
          }

          originalUnicodeUpdateTimeoutRef.current = setTimeout(() => {
            if (originalEditorRef.current && unicodeDecoratorsEnabled) {
              updateUnicodeDecorations(
                originalEditorRef.current,
                originalUnicodeDecoratorState,
              );
            }
          }, 200);
        });

        modifiedEditorRef.current.onDidScrollChange(() => {
          if (modifiedTimestampUpdateTimeoutRef.current) {
            clearTimeout(modifiedTimestampUpdateTimeoutRef.current);
          }

          modifiedTimestampUpdateTimeoutRef.current = setTimeout(() => {
            if (modifiedEditorRef.current && timestampDecoratorsEnabled) {
              updateTimestampDecorations(
                modifiedEditorRef.current,
                modifiedTimestampDecoratorState,
              );
            }
          }, 200); // 添加防抖

          if (modifiedBase64UpdateTimeoutRef.current) {
            clearTimeout(modifiedBase64UpdateTimeoutRef.current);
          }

          modifiedBase64UpdateTimeoutRef.current = setTimeout(() => {
            if (modifiedEditorRef.current && base64DecoratorsEnabled) {
              updateBase64Decorations(
                modifiedEditorRef.current,
                modifiedBase64DecoratorState,
              );
            }
          }, 200);

          if (modifiedUnicodeUpdateTimeoutRef.current) {
            clearTimeout(modifiedUnicodeUpdateTimeoutRef.current);
          }

          modifiedUnicodeUpdateTimeoutRef.current = setTimeout(() => {
            if (modifiedEditorRef.current && unicodeDecoratorsEnabled) {
              updateUnicodeDecorations(
                modifiedEditorRef.current,
                modifiedUnicodeDecoratorState,
              );
            }
          }, 200);
        });

        // 初始化完成后更新时间戳装饰器
        setTimeout(() => {
          if (originalEditorRef.current && modifiedEditorRef.current) {
            if (timestampDecoratorsEnabled) {
              // 初始化时间戳装饰器
              updateTimestampDecorations(
                originalEditorRef.current,
                originalTimestampDecoratorState,
              );
              updateTimestampDecorations(
                modifiedEditorRef.current,
                modifiedTimestampDecoratorState,
              );
            }

            // 初始化Base64下划线装饰器
            if (base64DecoratorsEnabled) {
              // 确保全局状态与本地状态同步
              setBase64ProviderEnabled(base64DecoratorsEnabled);
              setBase64DecorationEnabled(base64DecoratorsEnabled);
              updateBase64Decorations(
                originalEditorRef.current,
                originalBase64DecoratorState,
              );
              updateBase64Decorations(
                modifiedEditorRef.current,
                modifiedBase64DecoratorState,
              );
            }

            // 初始化Unicode装饰器
            if (unicodeDecoratorsEnabled) {
              // 确保全局状态与本地状态同步
              setUnicodeProviderEnabled(unicodeDecoratorsEnabled);
              setUnicodeDecorationEnabled(unicodeDecoratorsEnabled);
              updateUnicodeDecorations(
                originalEditorRef.current,
                originalUnicodeDecoratorState,
              );
              updateUnicodeDecorations(
                modifiedEditorRef.current,
                modifiedUnicodeDecoratorState,
              );
            }
          }
        }, 300);
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

  // 同步设置到store
  useEffect(() => {
    updateEditorSettings(tabKey, {
      fontSize: fontSize,
      language: currentLanguage,
      timestampDecoratorsEnabled: timestampDecoratorsEnabled,
      base64DecoratorsEnabled: base64DecoratorsEnabled,
      unicodeDecoratorsEnabled: unicodeDecoratorsEnabled,
    });
  }, [
    fontSize,
    currentLanguage,
    timestampDecoratorsEnabled,
    base64DecoratorsEnabled,
    unicodeDecoratorsEnabled,
    tabKey,
    updateEditorSettings,
  ]);

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
      window.innerHeight - 100,
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

        setEditorContent(
          `原始内容:\n${originalText}\n\n修改后内容:\n${modifiedText}`,
        );
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

  // 添加应用代码到左侧编辑器的函数
  const handleApplyCodeToLeft = (code: string) => {
    if (!code || !originalEditorRef.current) {
      toast.error("无法应用代码到左侧编辑器");

      return;
    }

    try {
      // 尝试解析JSON，确保是有效的JSON
      const jsonObj = JSON.parse(code);

      // 如果解析成功，格式化并设置到左侧编辑器
      setEditorValue(
        originalEditorRef.current,
        JSON.stringify(jsonObj, null, 2),
      );
      toast.success("已应用代码到左侧编辑器");
    } catch {
      // 如果解析失败，尝试直接设置文本
      try {
        setEditorValue(originalEditorRef.current, code);
        toast.success("已应用代码到左侧编辑器");
      } catch {
        toast.error("应用代码失败，格式可能不正确");
      }
    }
  };

  // 添加应用代码到右侧编辑器的函数
  const handleApplyCodeToRight = (code: string) => {
    if (!code || !modifiedEditorRef.current) {
      toast.error("无法应用代码到右侧编辑器");

      return;
    }

    try {
      // 尝试解析JSON，确保是有效的JSON
      const jsonObj = JSON.parse(code);

      // 如果解析成功，格式化并设置到右侧编辑器
      setEditorValue(
        modifiedEditorRef.current,
        JSON.stringify(jsonObj, null, 2),
      );
      toast.success("已应用代码到右侧编辑器");
    } catch {
      // 如果解析失败，尝试直接设置文本
      try {
        setEditorValue(modifiedEditorRef.current, code);
        toast.success("已应用代码到右侧编辑器");
      } catch {
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
        originalEditorRef.current?.focus();
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
      const originalVal = originalEditorRef.current?.getValue() || "";
      const modifiedVal = modifiedEditorRef.current?.getValue() || "";

      if (originalVal.trim() === "" && modifiedVal.trim() === "") {
        toast.error("编辑器内容为空，请先输入内容");

        return false;
      }
      setShowAiPrompt(true);

      return true;
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
    toggleTimestampDecorators: (enabled?: boolean) => {
      // 更新状态
      const newState =
        enabled !== undefined ? enabled : !timestampDecoratorsEnabled;

      setTimestampDecoratorsEnabled(newState);

      // 处理原始编辑器装饰器
      let result1 = true;
      let result2 = true;

      if (originalEditorRef.current) {
        result1 = toggleTimestampDecorators(
          originalEditorRef.current,
          originalTimestampDecoratorState,
          newState,
        );
      }

      // 处理修改后编辑器装饰器
      if (modifiedEditorRef.current) {
        result2 = toggleTimestampDecorators(
          modifiedEditorRef.current,
          modifiedTimestampDecoratorState,
          newState,
        );
      }

      return result1 && result2;
    },
    toggleBase64Decorators: (enabled?: boolean) => {
      // 更新状态
      const newState =
        enabled !== undefined ? enabled : !base64DecoratorsEnabled;

      setBase64DecoratorsEnabled(newState);

      return true;
    },
    toggleUnicodeDecorators: (enabled?: boolean) => {
      // 更新状态
      const newState =
        enabled !== undefined ? enabled : !unicodeDecoratorsEnabled;

      setUnicodeDecoratorsEnabled(newState);

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
      <AIPromptOverlay
        isOpen={showAiPrompt}
        placeholderText="向AI提问关于当前JSON比较的问题..."
        prompt={aiPrompt}
        quickPrompts={finalQuickPrompts}
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
          base64DecoratorsEnabled={base64DecoratorsEnabled}
          containerRef={editorContainerRef}
          currentFontSize={fontSize}
          currentLanguage={currentLanguage}
          tabKey={tabKey}
          timestampDecoratorsEnabled={timestampDecoratorsEnabled}
          unicodeDecoratorsEnabled={unicodeDecoratorsEnabled}
          onBase64DecoratorsChange={(enabled) => {
            setBase64DecoratorsEnabled(enabled);
          }}
          onFontSizeChange={setFontSize}
          onLanguageChange={setCurrentLanguage}
          onReset={() => {
            setFontSize(14);
            setCurrentLanguage("json");
            // 重置时也启用时间戳装饰器
            setTimestampDecoratorsEnabled(true);
            if (ref && typeof ref !== "function" && ref.current) {
              ref.current.toggleTimestampDecorators(true);
            }
          }}
          onTimestampDecoratorsChange={(enabled) => {
            setTimestampDecoratorsEnabled(enabled);
            // 调用ref方法来切换时间戳装饰器
            if (ref && typeof ref !== "function" && ref.current) {
              ref.current.toggleTimestampDecorators(enabled);
            }
          }}
          onUnicodeDecoratorsChange={(enabled) => {
            setUnicodeDecoratorsEnabled(enabled);
          }}
        />
      </div>

      {/* AI响应面板 - 从底部推出 */}
      <div
        ref={aiPanelRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 shadow-lg transition-transform duration-300 ease-out rounded-t-lg",
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
          className="w-full h-2 pt-1.5 cursor-ns-resize bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-blue-50/80 dark:from-neutral-900/80 dark:via-neutral-800/80 dark:to-neutral-900/80 dark:border-neutral-800 backdrop-blur-sm rounded-t-lg flex items-center justify-center"
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
          <div className="w-24 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
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
              isDiffEditor={true}
              showAttachButtons={false}
              useDirectApi={true}
              onApplyCodeToLeft={handleApplyCodeToLeft}
              onApplyCodeToRight={handleApplyCodeToRight}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

MonacoDiffEditor.displayName = "MonacoDiffEditor";

export default MonacoDiffEditor;
