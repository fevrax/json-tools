import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { loader, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import { Button, cn, useDisclosure } from "@heroui/react";
import { jsonrepair } from "jsonrepair";
import { Icon } from "@iconify/react";
import JSON5 from "json5";

import { AIResultHeader } from "./AIResultHeader";

import toast from "@/utils/toast";
import { useTabStore } from "@/store/useTabStore";
import {
  escapeJson,
  isArrayOrObject,
  json5ParseError,
  JsonErrorInfo,
  jsonParseError,
  removeJsonComments,
  sortJson,
} from "@/utils/json";
import { updateFoldingDecorations } from "@/components/monacoEditor/decorations/foldingDecoration.ts";
import {
  TimestampDecoratorState,
  clearTimestampCache,
  toggleTimestampDecorators,
  updateTimestampDecorations,
  handleContentChange,
} from "@/components/monacoEditor/decorations/timestampDecoration.ts";
import {
  ErrorDecoratorState,
  highlightErrorLine,
} from "@/components/monacoEditor/decorations/errorDecoration.ts";
import {
  Base64DecoratorState,
  clearBase64Cache,
  toggleBase64Decorators,
  updateBase64Decorations,
  handleBase64ContentChange,
} from "@/components/monacoEditor/decorations/base64Decoration.ts";
import {
  UnicodeDecoratorState,
  clearUnicodeCache,
  toggleUnicodeDecorators,
  updateUnicodeDecorations,
  handleUnicodeContentChange,
} from "@/components/monacoEditor/decorations/unicodeDecoration.ts";

import "@/styles/monaco.css";
import ErrorModal from "@/components/monacoEditor/ErrorModal.tsx";
import DraggableMenu from "@/components/monacoEditor/DraggableMenu.tsx";
import AIPromptOverlay, { QuickPrompt } from "@/components/ai/AIPromptOverlay";
import PromptContainer, {
  PromptContainerRef,
} from "@/components/ai/PromptContainer";
import { jsonQuickPrompts } from "@/components/ai/JsonQuickPrompts.tsx";

export interface MonacoJsonEditorProps {
  tabTitle?: string;
  tabKey: string;
  height?: number | string;
  value?: string;
  language?: string;
  theme?: string;
  minimap?: boolean;
  isSetting?: boolean; // 是否显示设置按钮
  isMenu?: boolean; // 是否显示悬浮菜单按钮
  showAi?: boolean; // 是否显示AI功能
  customQuickPrompts?: QuickPrompt[]; // 自定义快捷指令
  showTimestampDecorators?: boolean; // 是否显示时间戳装饰器
  showBase64Decorators?: boolean; // 是否显示Base64装饰器
  showUnicodeDecorators?: boolean; // 是否显示Unicode装饰器
  onUpdateValue: (value: string) => void;
  onMount?: () => void;
  ref?: React.Ref<MonacoJsonEditorRef>;
}

export interface MonacoJsonEditorRef {
  focus: () => void;
  layout: () => void;
  copy: (type?: "default" | "compress" | "escape") => boolean;
  format: () => boolean;
  validate: () => boolean;
  clear: () => boolean;
  fieldSort: (type: "asc" | "desc") => boolean;
  moreAction: (key: "unescape" | "del_comment") => boolean;
  saveFile: () => boolean;
  updateValue: (value: string) => void;
  setLanguage: (language: string) => void;
  showAiPrompt: () => void;
  toggleTimestampDecorators: (enabled?: boolean) => boolean; // 切换时间戳装饰器
  toggleBase64Decorators: (enabled?: boolean) => boolean; // 切换Base64装饰器
  toggleUnicodeDecorators: (enabled?: boolean) => boolean; // 切换Unicode装饰器
}

const MonacoJsonEditor: React.FC<MonacoJsonEditorProps> = ({
  value,
  tabKey,
  tabTitle,
  language,
  theme,
  height,
  isMenu = false,
  minimap = false,
  customQuickPrompts,
  showTimestampDecorators = true, // 默认开启时间戳装饰器
  showBase64Decorators = true, // 默认开启Base64装饰器
  showUnicodeDecorators = true, // 默认开启Unicode装饰器
  onUpdateValue,
  onMount,
  ref,
}) => {
  const { getTabByKey, updateEditorSettings } = useTabStore();
  const errorBottomHeight = 45; // 底部错误详情弹窗的高度
  const containerRef = useRef<HTMLDivElement>(null);
  const rootContainerRef = useRef<HTMLDivElement>(null); // 新增：根容器引用
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [parseJsonError, setParseJsonError] = useState<JsonErrorInfo | null>(
    null,
  );
  const parseJsonErrorShow = useRef<boolean>(false);
  const parseJsonErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorLayoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorDecorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const foldingDecorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);

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

  // 时间戳装饰器相关引用
  const timestampDecorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const timestampDecorationIdsRef = useRef<Record<string, string[]>>({});
  const timestampUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timestampCacheRef = useRef<Record<string, boolean>>({});
  // 时间戳装饰器启用状态，优先从编辑器设置中读取
  const [timestampDecoratorsEnabled, setTimestampDecoratorsEnabled] = useState(
    editorSettings.timestampDecoratorsEnabled !== undefined
      ? editorSettings.timestampDecoratorsEnabled
      : showTimestampDecorators,
  );

  // Base64装饰器相关引用
  const base64DecorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const base64DecorationIdsRef = useRef<Record<string, string[]>>({});
  const base64HoverProviderRef = useRef<monaco.IDisposable | null>(null);
  const base64UpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const base64CacheRef = useRef<Record<string, boolean>>({});

  // Base64装饰器启用状态，优先从编辑器设置中读取
  const [base64DecoratorsEnabled, setBase64DecoratorsEnabled] = useState(
    editorSettings.base64DecoratorsEnabled !== undefined
      ? editorSettings.base64DecoratorsEnabled
      : showBase64Decorators,
  );

  // Unicode装饰器相关引用
  const unicodeDecorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const unicodeDecorationIdsRef = useRef<Record<string, string[]>>({});
  const unicodeHoverProviderRef = useRef<monaco.IDisposable | null>(null);
  const unicodeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unicodeCacheRef = useRef<Record<string, boolean>>({});

  // Unicode装饰器启用状态，优先从编辑器设置中读取
  const [unicodeDecoratorsEnabled, setUnicodeDecoratorsEnabled] = useState(
    editorSettings.unicodeDecoratorsEnabled !== undefined
      ? editorSettings.unicodeDecoratorsEnabled
      : showUnicodeDecorators,
  );

  // 时间戳装饰器状态
  const timestampDecoratorState: TimestampDecoratorState = {
    editorRef: editorRef,
    decorationsRef: timestampDecorationsRef,
    decorationIdsRef: timestampDecorationIdsRef,
    updateTimeoutRef: timestampUpdateTimeoutRef,
    cacheRef: timestampCacheRef,
    enabled: timestampDecoratorsEnabled,
  };

  // Base64装饰器状态
  const base64DecoratorState: Base64DecoratorState = {
    editorRef: editorRef,
    decorationsRef: base64DecorationsRef,
    decorationIdsRef: base64DecorationIdsRef,
    hoverProviderId: { current: null },
    cacheRef: base64CacheRef,
    updateTimeoutRef: base64UpdateTimeoutRef,
    enabled: base64DecoratorsEnabled,
  };

  // Unicode装饰器状态
  const unicodeDecoratorState: UnicodeDecoratorState = {
    editorRef: editorRef,
    decorationsRef: unicodeDecorationsRef,
    decorationIdsRef: unicodeDecorationIdsRef,
    hoverProviderId: { current: null },
    cacheRef: unicodeCacheRef,
    updateTimeoutRef: unicodeUpdateTimeoutRef,
    enabled: unicodeDecoratorsEnabled,
  };

  // 错误高亮装饰器状态
  const errorDecoratorState: ErrorDecoratorState = {
    editorRef: editorRef,
    decorationsRef: errorDecorationsRef,
  };

  // AI相关状态
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiResponse, setShowAiResponse] = useState(false);

  // 添加一个引用以便访问PromptContainer组件的方法
  const promptContainerRef = useRef<PromptContainerRef>(null);

  // 为PromptContainer组件准备消息数组
  const [aiMessages, setAiMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: number }>
  >([]);

  // Ai 面板左右推拉相关状态
  const [aiPanelWidth, setAiPanelWidth] = useState(0);
  const [aiPanelIsDragging, setAIPaneIsDragging] = useState(false);
  const aiPanelDragStartX = useRef<number>(0);
  const aiPanelDragStartWidth = useRef<number>(0);

  const {
    isOpen: jsonErrorDetailsModel,
    onOpen: openJsonErrorDetailsModel,
    onClose: closeJsonErrorDetailsModel,
  } = useDisclosure();

  // 使用自定义快捷指令或默认快捷指令
  const finalQuickPrompts = customQuickPrompts || jsonQuickPrompts;

  // 计算编辑器实际高度，当有错误时减去错误信息栏的高度
  const getEditorHeight = () => {
    // 如果height是数字，直接使用；如果是字符串(如100%)，保持原样
    let baseHeight =
      typeof height === "number" ? `${height}px` : height || "100%";

    // 当显示错误信息时，减去错误栏高度
    if (parseJsonError) {
      return `calc(${baseHeight} - ${errorBottomHeight}px)`;
    }

    return baseHeight;
  };

  // 处理AI提交
  const handleAiSubmit = async () => {
    if (!aiPrompt.trim()) {
      toast.error("请输入提示词");

      return;
    }

    setShowAiPrompt(false);
    setShowAiResponse(true);

    // 添加用户消息到消息数组
    const userMessage = {
      role: "user" as const,
      content: aiPrompt,
      timestamp: Date.now(),
    };

    setAiMessages([userMessage]);

    // 保存prompt内容用于稍后发送
    const promptToSend = aiPrompt;

    setAiPrompt("");

    // 更新布局
    setTimeout(() => {
      editorRef.current?.layout();

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
  const closeAiResponse = () => {
    setShowAiResponse(false);
    // 清空消息历史
    setAiMessages([]);

    // 布局调整
    setTimeout(() => {
      editorRef.current?.layout();
    }, 100);
  };

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
      setEditorValue(JSON.stringify(jsonObj, null, 2));
      toast.success("已应用代码到编辑器");
    } catch {
      // 如果解析失败，尝试直接设置文本
      try {
        setEditorValue(code);
        toast.success("已应用代码到编辑器");
      } catch {
        toast.error("应用代码失败，格式可能不正确");
      }
    }
  };

  // 错误信息内容监听
  useEffect(() => {
    // 需要显示错误信息时
    if (parseJsonError && !parseJsonErrorShow.current) {
      setTimeout(() => {
        editorRef.current?.layout();
      }, 500);
      parseJsonErrorShow.current = true;
    } else if (parseJsonError == null && parseJsonErrorShow.current) {
      // 需要隐藏错误信息时
      setTimeout(() => {
        editorRef.current?.layout();
      }, 500);
      parseJsonErrorShow.current = false;
    }
  }, [parseJsonError]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        theme: theme,
      });
    }
  }, [theme]);

  // 字体大小变更监听
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: fontSize,
      });
    }
  }, [fontSize]);

  // 语言变更处理函数
  const handleLanguageChange = (newLanguage: string) => {
    setCurrentLanguage(newLanguage);

    // 通过ref方法设置语言
    const model = editorRef.current?.getModel();

    if (model) {
      monaco.editor.setModelLanguage(model, newLanguage);
    }
  };

  // 重置设置
  const handleReset = () => {
    setFontSize(14); // 重置字体大小
    handleLanguageChange("json"); // 重置语言

    // 重置时启用时间戳装饰器
    if (!timestampDecoratorsEnabled) {
      setTimestampDecoratorsEnabled(true);
      if (editorRef.current) {
        toggleTimestampDecorators(
          editorRef.current,
          timestampDecoratorState,
          true,
        );
      }
    }

    // 重置时启用Base64装饰器
    if (!base64DecoratorsEnabled) {
      setBase64DecoratorsEnabled(true);
      if (editorRef.current) {
        toggleBase64Decorators(editorRef.current, base64DecoratorState, true);
      }
    }

    // 重置时启用Unicode装饰器
    if (!unicodeDecoratorsEnabled) {
      setUnicodeDecoratorsEnabled(true);
      if (editorRef.current) {
        toggleUnicodeDecorators(editorRef.current, unicodeDecoratorState, true);
      }
    }

    toast.success("已重置编辑器设置");
  };

  // 延迟更新编辑器布局
  const editorDelayLayout = () => {
    if (editorLayoutTimeoutRef.current) {
      clearTimeout(editorLayoutTimeoutRef.current);
    }
    editorLayoutTimeoutRef.current = setTimeout(() => {
      editorRef.current?.layout();
    }, 50);
  };

  useEffect(() => {
    // 添加事件监听器
    window.addEventListener("resize", editorDelayLayout);

    // 清理函数 - 组件卸载时移除事件监听器
    return () => {
      window.removeEventListener("resize", editorDelayLayout);
    };
  }, []); // 空依赖数组表示这个效果只在组件挂载和卸载时运行

  // 语言切换时重新设置编辑器
  useEffect(() => {
    const model = monaco.editor.createModel(
      value as string,
      language || "json",
    );

    if (language !== "json" && language !== "json5") {
      setParseJsonError(null);
    }

    editorRef.current?.setModel(model);
    setCurrentLanguage(language || "json");
  }, [language]);

  // 当错误状态变化时，重新布局编辑器
  useEffect(() => {
    editorRef.current?.layout();
  }, [parseJsonError]);

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

  // 监听时间戳装饰器状态变化
  useEffect(() => {
    // 更新状态对象中的启用状态
    timestampDecoratorState.enabled = timestampDecoratorsEnabled;

    if (timestampDecoratorsEnabled) {
      // 清空缓存并更新装饰器
      clearTimestampCache(timestampDecoratorState);
      setTimeout(() => {
        if (editorRef.current) {
          updateTimestampDecorations(
            editorRef.current,
            timestampDecoratorState,
          );
        }
      }, 0);
    } else {
      // 禁用时清理缓存和装饰器
      if (timestampDecorationsRef.current) {
        timestampDecorationsRef.current.clear();
      }
      clearTimestampCache(timestampDecoratorState);
    }
  }, [timestampDecoratorsEnabled]);

  // 处理Base64装饰器状态变化
  useEffect(() => {
    // 更新状态对象中的启用状态
    base64DecoratorState.enabled = base64DecoratorsEnabled;

    if (base64DecoratorsEnabled) {
      // 清空缓存并更新装饰器
      clearBase64Cache(base64DecoratorState);
      setTimeout(() => {
        if (editorRef.current) {
          // 不再需要注册提供者，只需更新装饰器
          updateBase64Decorations(editorRef.current, base64DecoratorState);
        }
      }, 0);
    } else {
      // 禁用时清理缓存和装饰器
      if (base64DecorationsRef.current) {
        base64DecorationsRef.current.clear();
      }
      clearBase64Cache(base64DecoratorState);
    }
  }, [base64DecoratorsEnabled]);

  // 处理Unicode装饰器状态变化
  useEffect(() => {
    // 更新状态对象中的启用状态
    unicodeDecoratorState.enabled = unicodeDecoratorsEnabled;

    if (unicodeDecoratorsEnabled) {
      // 清空缓存并更新装饰器
      clearUnicodeCache(unicodeDecoratorState);
      setTimeout(() => {
        if (editorRef.current) {
          // 不再需要注册提供者，只需更新装饰器
          updateUnicodeDecorations(editorRef.current, unicodeDecoratorState);
        }
      }, 0);
    } else {
      // 禁用时清理缓存和装饰器
      if (unicodeDecorationsRef.current) {
        unicodeDecorationsRef.current.clear();
      }
      clearUnicodeCache(unicodeDecoratorState);
    }
  }, [unicodeDecoratorsEnabled]);

  // 初始化完成后更新时间戳装饰器
  if (timestampDecoratorsEnabled) {
    setTimeout(() => {
      if (editorRef.current) {
        updateTimestampDecorations(editorRef.current, timestampDecoratorState);
      }
    }, 300);
  }

  // 初始化Base64装饰器
  if (base64DecoratorsEnabled) {
    setTimeout(() => {
      if (editorRef.current) {
        // 不需要再次注册提供者，全局已注册
        updateBase64Decorations(editorRef.current, base64DecoratorState);
      }
    }, 300);
  }

  // 初始化Unicode装饰器
  if (unicodeDecoratorsEnabled) {
    setTimeout(() => {
      if (editorRef.current) {
        // 不需要再次注册提供者，全局已注册
        updateUnicodeDecorations(editorRef.current, unicodeDecoratorState);
      }
    }, 300);
  }

  // 验证编辑器内容
  const editorValueValidate = (val: string): boolean => {
    if (val.trim() === "") {
      setParseJsonError(null);

      return true;
    }

    let jsonErr: JsonErrorInfo | undefined;

    const languageId = editorRef.current?.getModel()?.getLanguageId();

    // 根据语言类型选择不同的解析器
    if (languageId === "json5") {
      jsonErr = json5ParseError(val);
    } else {
      jsonErr = jsonParseError(val);
    }

    if (jsonErr) {
      setParseJsonError(jsonErr);

      return false;
    } else {
      setParseJsonError(null);
    }

    return true;
  };

  // 验证格式并格式化
  const formatValidate = (): boolean => {
    if (!editorRef.current) {
      return false;
    }
    const val = editorRef.current.getValue();
    const isValid = editorValueValidate(val);

    if (!isValid) {
      return false;
    }

    return editorFormat();
  };

  const editorFormat = (): boolean => {
    if (!editorRef.current) {
      return false;
    }
    if (editorRef.current.getValue() === "") {
      toast.error("暂无内容!");

      return false;
    }

    // 如果是 JSON5 格式，使用 JSON5 格式化
    if (language === "json5") {
      try {
        const val = editorRef.current.getValue();
        const json5Obj = JSON5.parse(val);
        const formatted = JSON5.stringify(json5Obj, { space: 2 });

        setEditorValue(formatted);

        return true;
      } catch (error) {
        toast.error(`格式化失败: ${(error as Error).message}`);

        return false;
      }
    } else {
      // 对于其他格式，使用 Monaco 内置的格式化功能
      editorRef.current.getAction("editor.action.formatDocument")?.run();
    }

    return true;
  };

  // 一键定位到错误行
  const goToErrorLine = () => {
    if (!parseJsonError || parseJsonError.line <= 0) {
      toast.error("一键定位失败");

      return;
    }
    closeJsonErrorDetailsModel();

    if (editorRef.current) {
      highlightErrorLine(
        editorRef.current,
        errorDecoratorState,
        parseJsonError.line,
      );
    }
  };

  const autoFix = (): boolean => {
    try {
      const jsonText = editorRef.current?.getValue() || "";

      if (jsonText === "") {
        toast.warning("暂无内容");

        return false;
      }
      const repaired = jsonrepair(jsonText);

      setEditorValue(repaired);

      closeJsonErrorDetailsModel();
      setParseJsonError(null);
      toast.success("修复成功");

      return true;
    } catch (e) {
      console.error("repairJson", e);
      toast.error("修复失败，可能不是有效的 Json 数据");

      return false;
    }
  };

  // 复制到剪贴板
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // 解码 JSON 处理转义
  // return '' 为正常
  const formatModelByUnEscapeJson = (jsonText: string): string => {
    if (jsonText === "") {
      return "暂无数据";
    }
    const jsonStr = `"${jsonText}"`;

    try {
      // 第一次将解析结果为去除转移后字符串
      const unescapedJson = JSON.parse(jsonStr);
      // 去除转义后的字符串解析为对象
      const unescapedJsonObject = JSON.parse(unescapedJson);

      // 判断是否为对象或数组
      if (!isArrayOrObject(unescapedJsonObject)) {
        return "不是有效的 JSON 数据，无法进行解码操作";
      }
      setEditorValue(JSON.stringify(unescapedJsonObject, null, 4));
    } catch (error) {
      console.error("formatModelByUnEscapeJson", error);
      if (error instanceof SyntaxError) {
        return "不是有效的转义 JSON 字符串，无法进行解码操作";
      }

      return `尝试去除转义失败，${error}`;
    }

    return "";
  };

  // 开始拖动处理
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      aiPanelDragStartX.current = e.clientX;
      aiPanelDragStartWidth.current = aiPanelWidth;
      setAIPaneIsDragging(true);
    },
    [aiPanelWidth],
  );

  // 拖动AI面板
  const handleMouseAIPanelMove = useCallback(
    (e: MouseEvent) => {
      if (!aiPanelIsDragging || !rootContainerRef.current) return;

      // 使用requestAnimationFrame优化性能
      requestAnimationFrame(() => {
        if (!rootContainerRef.current) return;

        const totalWidth = rootContainerRef.current.offsetWidth;

        if (totalWidth <= 0) return; // 如果宽度无效则避免计算

        const minPanelWidthPx = 200; // 两个面板的最小宽度（像素）

        // 确保最小面板宽度不超过总宽度的一半（减去缓冲区）
        const effectiveMinWidth = Math.min(
          minPanelWidthPx,
          totalWidth / 2 - 10,
        );

        // 基于有效最小宽度计算aiPanelWidth的边界
        // 下限：确保AI面板至少为effectiveMinWidth
        const lowerBound = effectiveMinWidth - 0.4 * totalWidth;
        // 上限：确保编辑器面板至少为effectiveMinWidth
        const upperBound = 0.6 * totalWidth - effectiveMinWidth;

        // 根据拖动偏移量计算潜在的aiPanelWidth
        const deltaX = e.clientX - aiPanelDragStartX.current;
        // 向左拖动时aiPanelWidth增加（deltaX为负）
        let potentialAiPanelWidth = aiPanelDragStartWidth.current - deltaX;

        // 将潜在宽度限制在计算的边界内，确保lowerBound <= upperBound
        if (lowerBound <= upperBound) {
          const clampedAiPanelWidth = Math.max(
            lowerBound,
            Math.min(potentialAiPanelWidth, upperBound),
          );

          setAiPanelWidth(clampedAiPanelWidth);
        } else {
          // 处理边界无效的边缘情况（例如，totalWidth太小）
          // 可选：设置为默认值或中间状态，或者不更新
          console.warn("Invalid resize bounds", {
            totalWidth,
            lowerBound,
            upperBound,
          });
        }

        // 更新编辑器布局
        editorRef.current?.layout();
      });
    },
    [aiPanelIsDragging],
  );

  // 鼠标抬起处理
  const handleMouseAIPanelUp = useCallback(() => {
    setAIPaneIsDragging(false);
  }, []);

  // 添加/移除鼠标事件监听
  useEffect(() => {
    if (aiPanelIsDragging) {
      document.addEventListener("mousemove", handleMouseAIPanelMove);
      document.addEventListener("mouseup", handleMouseAIPanelUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "ew-resize";
    } else {
      document.removeEventListener("mousemove", handleMouseAIPanelMove);
      document.removeEventListener("mouseup", handleMouseAIPanelUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseAIPanelMove);
      document.removeEventListener("mouseup", handleMouseAIPanelUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [aiPanelIsDragging, handleMouseAIPanelMove, handleMouseAIPanelUp]);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    updateValue: (value: string) => {
      setEditorValue(value);
    },
    focus: () => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    },
    layout: () => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    },
    showAiPrompt: () => {
      const val = editorRef.current?.getValue() || "";

      if (val.trim() === "") {
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

      const val = editorRef.current.getValue();

      if (!type || type === "default") {
        copyText(val);

        return true;
      }

      if (val.trim() === "") {
        toast.warning("暂无内容");

        return false;
      }

      const isValid = editorValueValidate(val);

      if (!isValid) {
        return false;
      }
      switch (type) {
        case "compress":
          const compressed = JSON.stringify(JSON.parse(val));

          copyText(compressed);
          setEditorValue(compressed);
          break;
        case "escape":
          copyText(escapeJson(val));
          break;
        default:
          copyText(val);
          break;
      }

      return true;
    },
    format: () => {
      return formatValidate();
    },
    validate: () => {
      if (!editorRef.current) {
        return false;
      }

      const val = editorRef.current.getValue();

      if (val.trim() === "") {
        return true;
      }

      return editorValueValidate(val);
    },
    clear: () => {
      if (editorRef.current) {
        setEditorValue("");

        return true;
      }

      return false;
    },
    fieldSort: (type: "asc" | "desc"): boolean => {
      if (!editorRef.current) {
        return false;
      }
      const val = editorRef.current.getValue();
      const isValid = editorValueValidate(val);

      if (!isValid) {
        return false;
      }
      const jsonObj = JSON.parse(val);

      if (type === "asc") {
        setEditorValue(sortJson(jsonObj, "asc"));
      } else if (type === "desc") {
        setEditorValue(sortJson(jsonObj, "desc"));
      }

      return true;
    },
    // 处理更多操作
    moreAction: (key: "unescape" | "del_comment"): boolean => {
      if (!editorRef.current) {
        return false;
      }
      const val = editorRef.current.getValue();

      switch (key) {
        case "unescape":
          const errorMsg = formatModelByUnEscapeJson(val);

          if (errorMsg) {
            toast.error(errorMsg);

            return false;
          }
          break;
        case "del_comment":
          setEditorValue(removeJsonComments(val));

          return true;
        default:
          break;
      }

      return true;
    },
    saveFile: () => {
      // 将 json 内容保存到 tabName.json 文件
      const val = editorRef.current?.getValue() || "";

      if (val.trim() === "") {
        toast.warning("暂无内容");

        return false;
      }
      const fileName = `${tabTitle}.json`;
      const blob = new Blob([val], { type: "text/plain;charset=utf-8" });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = downloadUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      return true;
    },
    setLanguage: (newLanguage: string) => {
      const model = editorRef.current?.getModel();

      if (model) {
        monaco.editor.setModelLanguage(model, newLanguage);
      }
    },
    toggleTimestampDecorators: (enabled?: boolean) => {
      // 更新状态
      const newState =
        enabled !== undefined ? enabled : !timestampDecoratorsEnabled;

      setTimestampDecoratorsEnabled(newState);

      // 使用抽离出的函数处理装饰器
      return toggleTimestampDecorators(
        editorRef.current,
        timestampDecoratorState,
        newState,
      );
    },
    toggleBase64Decorators: (enabled?: boolean) => {
      // 更新状态
      const newState =
        enabled !== undefined ? enabled : !base64DecoratorsEnabled;

      setBase64DecoratorsEnabled(newState);

      // 使用抽离出的函数处理装饰器
      return toggleBase64Decorators(
        editorRef.current,
        base64DecoratorState,
        newState,
      );
    },
    toggleUnicodeDecorators: (enabled?: boolean) => {
      // 更新状态
      const newState =
        enabled !== undefined ? enabled : !unicodeDecoratorsEnabled;

      setUnicodeDecoratorsEnabled(newState);

      // 使用抽离出的函数处理装饰器
      return toggleUnicodeDecorators(
        editorRef.current,
        unicodeDecoratorState,
        newState,
      );
    },
  }));

  // 修改初始化编辑器的函数并调用
  useEffect(() => {
    // 使用 setTimeout 确保在 React 严格模式下只执行一次
    const timeoutId = setTimeout(async () => {
      console.log("initializeEditor", tabKey);
      // 确保只初始化一次
      if (editorRef.current) return;

      // 注意: 这里使用全局初始化的Monaco实例，不再重复加载配置
      const monacoInstance: Monaco = await loader.init();

      if (containerRef.current) {
        const editor = monacoInstance.editor.create(containerRef.current, {
          value: value || "",
          language: language || "json",
          minimap: {
            enabled: minimap, // 启用缩略图
          },
          // fontFamily: `"Arial","Microsoft YaHei","黑体","宋体", sans-serif`, // 字体
          fontSize: fontSize, // 使用状态中的字体大小
          colorDecorators: true, // 颜色装饰器
          readOnly: false, // 是否开启已读功能
          theme: theme || "vs-light", // 主题
          mouseWheelZoom: true, // 启用鼠标滚轮缩放
          formatOnPaste: false, // 粘贴时自动格式化
          formatOnType: false, // 输入时自动格式化
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
          folding: true, // 启用代码折叠功能
        });

        onMount && onMount();

        editor.focus();

        // 监听折叠状态变化
        editor.onDidChangeHiddenAreas(() => {
          if (editorRef.current) {
            updateFoldingDecorations(
              editorRef.current,
              currentLanguage,
              foldingDecorationsRef,
            );
          }
        });

        // 监听滚动事件
        editor.onDidScrollChange(() => {
          if (timestampUpdateTimeoutRef.current) {
            clearTimeout(timestampUpdateTimeoutRef.current);
          }

          timestampUpdateTimeoutRef.current = setTimeout(() => {
            if (editorRef.current) {
              updateTimestampDecorations(
                editorRef.current,
                timestampDecoratorState,
              );
            }
          }, 200); // 添加防抖

          if (base64UpdateTimeoutRef.current) {
            clearTimeout(base64UpdateTimeoutRef.current);
          }

          base64UpdateTimeoutRef.current = setTimeout(() => {
            if (editorRef.current) {
              updateBase64Decorations(editorRef.current, base64DecoratorState);
            }
          }, 200);

          if (unicodeUpdateTimeoutRef.current) {
            clearTimeout(unicodeUpdateTimeoutRef.current);
          }

          unicodeUpdateTimeoutRef.current = setTimeout(() => {
            if (editorRef.current) {
              updateUnicodeDecorations(
                editorRef.current,
                unicodeDecoratorState,
              );
            }
          }, 200);
        });

        // 监听内容变化
        editor.onDidChangeModelContent((e) => {
          const val = editor.getValue();
          const languageId = editorRef.current?.getModel()?.getLanguageId();

          if (languageId === "json" || languageId === "json5") {
            if (parseJsonErrorTimeoutRef.current) {
              clearTimeout(parseJsonErrorTimeoutRef.current);
            }
            // 自动验证 JSON 内容
            parseJsonErrorTimeoutRef.current = setTimeout(() => {
              editorValueValidate(val);
            }, 1000);

            // 更新时间戳装饰器
            if (timestampDecoratorsEnabled) {
              handleContentChange(e, timestampDecoratorState);
            }

            // 更新 Base64 下划线装饰器
            if (base64DecoratorsEnabled) {
              handleBase64ContentChange(e, base64DecoratorState);
            }

            // 更新 Unicode 下划线装饰器
            if (unicodeDecoratorsEnabled) {
              handleUnicodeContentChange(e, unicodeDecoratorState);
            }
          }
          onUpdateValue(val);
        });

        // 添加粘贴事件监听
        editor.onDidPaste(() => {});

        editorRef.current = editor;

        // 初始化完成后更新时间戳装饰器
        if (timestampDecoratorsEnabled) {
          setTimeout(() => {
            if (editorRef.current) {
              updateTimestampDecorations(
                editorRef.current,
                timestampDecoratorState,
              );
            }
          }, 300);
        }

        // 初始化Base64装饰器 - 注意这里只更新装饰器，不再注册悬停提供者
        if (base64DecoratorsEnabled) {
          setTimeout(() => {
            if (editorRef.current) {
              // 不需要再次注册提供者，全局已注册
              updateBase64Decorations(editorRef.current, base64DecoratorState);
            }
          }, 300);
        }

        // 初始化Unicode装饰器 - 注意这里只更新装饰器，不再注册悬停提供者
        if (unicodeDecoratorsEnabled) {
          setTimeout(() => {
            if (editorRef.current) {
              // 不需要再次注册提供者，全局已注册
              updateUnicodeDecorations(
                editorRef.current,
                unicodeDecoratorState,
              );
            }
          }, 300);
        }
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []); // 空依赖数组表示这个效果只在组件挂载和卸载时运行

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

  return (
    <div
      ref={rootContainerRef}
      className="flex flex-col relative w-full h-full"
      style={{ height }}
    >
      <AIPromptOverlay
        isOpen={showAiPrompt}
        placeholderText="输入您的问题..."
        prompt={aiPrompt}
        quickPrompts={finalQuickPrompts}
        onClose={() => setShowAiPrompt(false)}
        onPromptChange={setAiPrompt}
        onSubmit={handleAiSubmit}
      />

      <div
        className={cn(
          "w-full h-full overflow-hidden",
          showAiResponse ? "flex flex-row" : "",
        )}
        style={{ height: getEditorHeight() }}
      >
        {showAiResponse ? (
          <>
            {/* 左侧编辑器区域 */}
            <div
              className="h-full overflow-hidden border-r border-default-200 dark:border-default-100/20 monaco-editor-container"
              style={{ width: `calc(60% - ${aiPanelWidth}px)` }}
            >
              <div ref={containerRef} className="h-full w-full" />
            </div>

            {/* 拖动条 */}
            <div
              className="w-2 h-full cursor-ew-resize bg-gradient-to-b from-blue-50/80 via-indigo-50/80 to-blue-50/80 dark:from-neutral-900/80 dark:via-neutral-800/80 dark:to-neutral-900/80 dark:border-neutral-800 backdrop-blur-sm flex items-center justify-center"
              role="button"
              style={{ touchAction: "none" }}
              onMouseDown={handleDragStart}
            >
              <div className="h-24 w-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* 右侧AI响应区域 */}
            <div
              className="h-full overflow-hidden flex flex-col bg-white/95 dark:bg-neutral-900/95 ai-panel"
              style={{ width: `calc(40% + ${aiPanelWidth}px)` }}
            >
              {/* AI标题栏 */}
              <AIResultHeader onClose={handleCloseAiResponse} />

              {/* AI面板 */}
              <div className="flex-1 h-full overflow-hidden">
                <PromptContainer
                  ref={promptContainerRef}
                  className="h-full"
                  editorContent={editorRef.current?.getValue() || ""}
                  initialMessages={aiMessages}
                  showAttachButtons={false}
                  useDirectApi={true}
                  onApplyCode={handleApplyCode}
                />
              </div>
            </div>
          </>
        ) : (
          // 普通模式：只显示一个编辑器
          <div ref={containerRef} className="w-full h-full" />
        )}
      </div>

      {/* 可拖动悬浮菜单 */}
      {isMenu && (
        <DraggableMenu
          base64DecoratorsEnabled={base64DecoratorsEnabled}
          containerRef={rootContainerRef}
          currentFontSize={fontSize}
          currentLanguage={currentLanguage}
          tabKey={tabKey}
          timestampDecoratorsEnabled={timestampDecoratorsEnabled}
          unicodeDecoratorsEnabled={unicodeDecoratorsEnabled}
          onBase64DecoratorsChange={(enabled) => {
            setBase64DecoratorsEnabled(enabled);
            // 调用内部方法切换Base64装饰器
            if (editorRef.current) {
              toggleBase64Decorators(
                editorRef.current,
                base64DecoratorState,
                enabled,
              );
            }
          }}
          onFontSizeChange={setFontSize}
          onLanguageChange={handleLanguageChange}
          onReset={handleReset}
          onTimestampDecoratorsChange={(enabled) => {
            setTimestampDecoratorsEnabled(enabled);
            // 调用内部方法切换时间戳装饰器
            if (editorRef.current) {
              toggleTimestampDecorators(
                editorRef.current,
                timestampDecoratorState,
                enabled,
              );
            }
          }}
          onUnicodeDecoratorsChange={(enabled) => {
            setUnicodeDecoratorsEnabled(enabled);
            // 调用内部方法切换Unicode装饰器
            if (editorRef.current) {
              toggleUnicodeDecorators(
                editorRef.current,
                unicodeDecoratorState,
                enabled,
              );
            }
          }}
        />
      )}

      <div
        className={cn(
          "flex justify-between items-center px-3 text-white text-base transition-all duration-300 z-50",
          {
            "h-0 opacity-0 invisible": !parseJsonError,
            [`h-[${errorBottomHeight}px] opacity-100 visible`]: parseJsonError,
          },
        )}
        style={{
          height:
            parseJsonError && parseJsonError.line > 0 ? errorBottomHeight : 0,
          backgroundColor: "#ED5241",
          overflow: "hidden",
          position: "sticky",
          bottom: 0,
        }}
      >
        <div className="flex items-center space-x-3">
          <Icon icon="fluent:warning-28-filled" width={24} />
          <p className="">
            第 {parseJsonError?.line || 0} 行，第 {parseJsonError?.column || 0}{" "}
            列错误， {parseJsonError?.message}
          </p>
        </div>
        <div className={"flex items-center space-x-2"}>
          <Button
            className="bg-white/20"
            color="primary"
            size="sm"
            startContent={<Icon icon="hugeicons:view" width={16} />}
            onPress={openJsonErrorDetailsModel}
          >
            查看详情
          </Button>
          <Button
            className="bg-white/20"
            color="primary"
            size="sm"
            startContent={<Icon icon="mynaui:tool" width={16} />}
            onPress={autoFix}
          >
            自动修复
          </Button>
          <Button
            className="bg-white/20"
            color="primary"
            size="sm"
            startContent={<Icon icon="mingcute:location-line" width={16} />}
            onPress={goToErrorLine}
          >
            一键定位
          </Button>
        </div>
      </div>
      <ErrorModal
        isOpen={jsonErrorDetailsModel}
        parseJsonError={parseJsonError}
        onAutoFix={autoFix}
        onClose={closeJsonErrorDetailsModel}
        onGotoErrorLine={goToErrorLine}
      />
    </div>
  );
};

MonacoJsonEditor.displayName = "MonacoJsonEditor";

export default MonacoJsonEditor;
