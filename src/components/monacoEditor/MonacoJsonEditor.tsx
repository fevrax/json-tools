import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";
import { loader, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { Button, cn, useDisclosure } from "@heroui/react";
import { editor } from "monaco-editor";
import { jsonrepair } from "jsonrepair";
import { Icon } from "@iconify/react";
import JSON5 from "json5";

import { AIResultHeader } from "./AIResultHeader";

import toast from "@/utils/toast";
import { useTabStore } from "@/store/useTabStore";
import {
  escapeJson,
  isArrayOrObject,
  JsonErrorInfo,
  jsonParseError,
  json5ParseError,
  removeJsonComments,
  sortJson,
} from "@/utils/json";

import "@/styles/monaco.css";
import ErrorModal from "@/components/monacoEditor/ErrorModal.tsx";
import DraggableMenu from "@/components/monacoEditor/DraggableMenu.tsx";
import AIPromptOverlay, { QuickPrompt } from "@/components/ai/AIPromptOverlay";
import PromptContainer, {
  PromptContainerRef,
} from "@/components/ai/PromptContainer";

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
  onUpdateValue,
  onMount,
  ref,
}) => {
  const { getTabByKey } = useTabStore();
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

  // 左右推拉相关状态
  const [aiPanelWidth, setAiPanelWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number>(0);
  const dragStartWidth = useRef<number>(0);

  // 开始拖动处理
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragStartX.current = e.clientX;
      dragStartWidth.current = aiPanelWidth;
      setIsDragging(true);
    },
    [aiPanelWidth],
  );

  // 拖动AI面板
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !rootContainerRef.current) return;

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
        const deltaX = e.clientX - dragStartX.current;
        // 向左拖动时aiPanelWidth增加（deltaX为负）
        let potentialAiPanelWidth = dragStartWidth.current - deltaX;

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
          // 作为回退，如果边界无效则居中
          // setAiPanelWidth(0); // 或者不做任何操作保留上一个值
        }

        // 更新编辑器布局
        editorRef.current?.layout();
      });
    },
    [isDragging],
  );

  // 鼠标抬起处理
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 添加/移除鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "ew-resize";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
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

  const {
    isOpen: jsonErrorDetailsModel,
    onOpen: openJsonErrorDetailsModel,
    onClose: closeJsonErrorDetailsModel,
  } = useDisclosure();

  const jsonQuickPrompts: QuickPrompt[] = [
    {
      id: "fix_json",
      label: "修复JSON",
      icon: "mdi:wrench",
      prompt: "这个JSON有错误，请帮我修复",
      color: "success",
    },
    {
      id: "convert_to_go",
      label: "生成 Go 结构体",
      icon: "simple-icons:go",
      prompt: "请根据这个JSON生成 Go 结构体定义",
      color: "primary",
    },
    {
      id: "convert_to_typescript",
      label: "生成 TS 类型",
      icon: "simple-icons:typescript",
      prompt: "请根据这个JSON 生成 TypeScript 接口定义",
      color: "default",
    },
    {
      id: "generate_sample",
      label: "生成示例数据",
      icon: "mdi:database-outline",
      prompt: "根据这个JSON结构生成10条示例数据",
      color: "warning",
    },
    {
      id: "validate_json",
      label: "校验数据",
      icon: "mdi:check-circle-outline",
      prompt: "请检查这个JSON是否有逻辑错误或格式问题",
      color: "danger",
    },
  ];

  // 使用自定义快捷指令或默认快捷指令
  const finalQuickPrompts = customQuickPrompts || jsonQuickPrompts;

  // 计算编辑器实际高度，当有错误时减少错误信息栏的高度
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

  useEffect(() => {
    // 使用 setTimeout 确保在 React 严格模式下只执行一次
    const timeoutId = setTimeout(() => {
      initializeEditor();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []); // 空依赖数组确保只在挂载时执行

  // 更新折叠装饰器
  const updateFoldingDecorations = () => {
    if (!editorRef.current) return;

    // 强制应用自定义样式到折叠元素
    setTimeout(() => {
      const foldedElements = document.querySelectorAll(
        ".monaco-editor .inline-folded",
      );

      foldedElements.forEach((el) => {
        // 确保自定义样式被应用
        el.classList.add("inline-folded");

        // 获取折叠元素的长度信息
        const elementCount = getElementCountFromPosition(el);

        if (elementCount !== null) {
          // 设置自定义属性，用于CSS中显示元素长度
          el.setAttribute("data-element-count", elementCount.toString());
        }
      });
    }, 50);
  };

  // 获取折叠对象或数组的元素数量
  const getElementCountFromPosition = (element: Element): number | null => {
    if (!editorRef.current) return null;

    try {
      // 获取折叠元素所在的行号
      const lineNumber = getLineNumberFromElement(element);

      if (!lineNumber) return null;

      const model = editorRef.current.getModel();

      if (!model) return null;

      // 获取当前行的内容
      const lineContent = model.getLineContent(lineNumber);
      const trimmedLine = lineContent.trim();

      // 确定是否为对象或数组的开始行
      const isObject = trimmedLine.endsWith("{");
      const isArray = trimmedLine.endsWith("[");

      if (!isObject && !isArray) return null;

      // 获取完整文本，用于结构化分析
      const fullText = model.getValue();

      // 确定开始和结束的位置
      let startPos = model.getOffsetAt({ lineNumber, column: 1 });
      let openBrackets = 0;
      let closeBrackets = 0;
      let endPos = startPos;

      // 查找匹配的闭合括号来确定块的范围
      const openChar = isObject ? "{" : "[";
      const closeChar = isObject ? "}" : "]";

      for (let i = startPos; i < fullText.length; i++) {
        const char = fullText[i];

        if (char === openChar) openBrackets++;
        if (char === closeChar) closeBrackets++;

        // 当闭合括号数量与开放括号相等时，找到块结束位置
        if (openBrackets > 0 && openBrackets === closeBrackets) {
          endPos = i + 1;
          break;
        }
      }

      // 提取块内容
      const blockContent = fullText.substring(startPos, endPos);

      // 先尝试用JSON.parse直接解析，这是最准确的方式
      try {
        const parsed = JSON.parse(blockContent);

        if (isObject) {
          return Object.keys(parsed).length;
        } else {
          return Array.isArray(parsed) ? parsed.length : 0;
        }
      } catch (e) {
        // JSON解析失败，使用字符级别的解析
        if (isObject) {
          return countObjectProperties(blockContent);
        } else {
          return countArrayElements(blockContent);
        }
      }

      return null;
    } catch (error) {
      console.warn("Error calculating element count:", error);

      return null;
    }
  };

  // 计算对象中的属性数量
  const countObjectProperties = (blockContent: string): number => {
    // 移除首尾的花括号和空白
    const content = blockContent.trim().replace(/^{|}$/g, "").trim();

    if (!content) return 0;

    // 处理只有一个属性的特殊情况
    if (!content.includes(",")) {
      // 检查是否有键值对模式（比如 "key": value）
      if (content.match(/"[^"]*"\s*:|'[^']*'\s*:|\w+\s*:/)) {
        return 1;
      }
    }

    // 计算顶级属性（考虑嵌套对象和数组）
    let count = 0;
    let inString = false;
    let stringChar = "";
    let bracketDepth = 0;
    let braceDepth = 0;
    let hasContent = false; // 标记是否有实际内容

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      // 处理字符串
      if (
        (char === '"' || char === "'") &&
        (i === 0 || content[i - 1] !== "\\")
      ) {
        if (!inString) {
          inString = true;
          stringChar = char;
          hasContent = true;
        } else if (stringChar === char) {
          inString = false;
        }
        continue;
      }

      if (inString) continue;

      // 跳过空白字符
      if (/\s/.test(char)) continue;

      // 非空白字符表示有内容
      if (!/[,{}[\]]/.test(char)) {
        hasContent = true;
      }

      // 处理嵌套
      if (char === "{") {
        braceDepth++;
        hasContent = true;
      }
      if (char === "}") braceDepth--;
      if (char === "[") {
        bracketDepth++;
        hasContent = true;
      }
      if (char === "]") bracketDepth--;

      // 在顶级找到逗号或结束
      if (
        (char === "," || i === content.length - 1) &&
        braceDepth === 0 &&
        bracketDepth === 0
      ) {
        // 确保前面有内容才计数
        if (
          hasContent ||
          (i === content.length - 1 && count === 0 && content.trim())
        ) {
          count++;
        }
        hasContent = false;
      }
    }

    return count;
  };

  // 计算数组中的元素数量
  const countArrayElements = (blockContent: string): number => {
    // 首先尝试再次用JSON.parse解析，这是最可靠的方法
    try {
      const content = blockContent.trim();

      if (!content) return 0;

      const parsed = JSON.parse(content);

      if (Array.isArray(parsed)) {
        return parsed.length;
      }
    } catch (e) {
      // 解析失败，继续使用字符级解析
    }

    // 准备用字符级解析处理
    // 移除首尾的方括号
    const trimmedContent = blockContent.trim();

    if (trimmedContent === "[]") return 0;

    // 提取数组内容，去除首尾的方括号
    let content = "";
    let bracketDepth = 0;
    let foundStart = false;

    for (let i = 0; i < trimmedContent.length; i++) {
      const char = trimmedContent[i];

      if (char === "[") {
        bracketDepth++;
        if (!foundStart) {
          foundStart = true;
          continue; // 跳过第一个左方括号
        }
      } else if (char === "]") {
        bracketDepth--;
        if (bracketDepth === 0 && foundStart) {
          break; // 结束于最后一个右方括号
        }
      }

      if (foundStart) {
        content += char;
      }
    }

    // 如果是空数组或无法提取内容
    if (!content.trim()) return 0;

    // 在顶层扫描并计数
    let elementCount = 0;
    let pos = 0;
    let inString = false;
    let stringChar = "";
    let objectDepth = 0;
    let arrayDepth = 0;

    // 使用扫描状态机
    while (pos < content.length) {
      const char = content[pos];

      // 处理字符串
      if (
        (char === '"' || char === "'") &&
        (pos === 0 || content[pos - 1] !== "\\")
      ) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
        pos++;
        continue;
      }

      // 在字符串内部的字符直接跳过
      if (inString) {
        pos++;
        continue;
      }

      // 处理对象和数组嵌套
      if (char === "{") {
        objectDepth++;
      } else if (char === "}") {
        objectDepth--;
      } else if (char === "[") {
        arrayDepth++;
      } else if (char === "]") {
        arrayDepth--;
      }
      // 只有在顶层(不在任何对象或数组内)时才计算逗号
      else if (char === "," && objectDepth === 0 && arrayDepth === 0) {
        elementCount++;
      }

      pos++;
    }

    // 加上最后一个元素(因为最后一个元素后面没有逗号)
    elementCount++;

    return elementCount;
  };

  // 获取折叠元素所在的行号
  const getLineNumberFromElement = (element: Element): number | null => {
    if (!editorRef.current) return null;

    // 查找包含行号信息的父元素
    let currentElement: Element | null = element;

    while (currentElement) {
      // 尝试获取Monaco编辑器在DOM元素上设置的行号属性
      const lineNumberAttribute =
        currentElement.getAttribute("data-line-index") ||
        currentElement.getAttribute("data-line-number") ||
        currentElement.getAttribute("data-line");

      if (lineNumberAttribute) {
        // Monaco编辑器中行号是从0开始的，所以需要+1
        return parseInt(lineNumberAttribute, 10) + 1;
      }

      // 尝试从class中提取行号（某些版本的Monaco可能使用这种方式）
      const classNames = currentElement.className.split(" ");

      for (const className of classNames) {
        if (className.startsWith("line-")) {
          const lineMatch = className.match(/line-(\d+)/);

          if (lineMatch && lineMatch[1]) {
            return parseInt(lineMatch[1], 10);
          }
        }
      }

      currentElement = currentElement.parentElement;
    }

    try {
      // 通过DOM位置确定行号 - 查找元素在视图中的位置并映射到编辑器行
      const editorDomNode = editorRef.current.getDomNode();

      if (editorDomNode && editorDomNode.contains(element)) {
        const elementRect = element.getBoundingClientRect();
        const editorRect = editorDomNode.getBoundingClientRect();
        const relativeY = elementRect.top - editorRect.top;
        const lineHeight = editorRef.current.getOption(
          monaco.editor.EditorOption.lineHeight,
        );
        const visibleRanges = editorRef.current.getVisibleRanges();

        if (visibleRanges.length > 0) {
          const firstLineInView = visibleRanges[0].startLineNumber;
          const approximateLine =
            firstLineInView + Math.floor(relativeY / lineHeight);

          return approximateLine;
        }
      }
    } catch (error) {
      console.warn("Error calculating line number from position:", error);
    }

    // 获取当前光标位置行号作为后备
    const position = editorRef.current.getPosition();

    return position ? position.lineNumber : null;
  };

  // 初始化编辑器的函数
  const initializeEditor = async () => {
    console.log("initializeEditor", tabKey);
    // 确保只初始化一次
    if (editorRef.current) return;
    // const settings = await storage.getItem<SettingsState>("settings");

    // if (settings?.monacoEditorCDN == "cdn") {
    //   loader.config({
    //     paths: {
    //       vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs",
    //     },
    //   });
    //   loader.config({ "vs/nls": { availableLanguages: { "*": "zh-cn" } } });
    // } else {
    // }
    loader.config({ monaco });

    const monacoInstance: Monaco = await loader.init();

    // 注册 JSON5 语言支持
    if (
      !monacoInstance.languages
        .getLanguages()
        .some((lang) => lang.id === "json5")
    ) {
      monacoInstance.languages.register({ id: "json5" });

      // 设置 JSON5 语法高亮规则，基于 JSON 规则但添加了 JSON5 特性支持
      monacoInstance.languages.setMonarchTokensProvider("json5", {
        defaultToken: "invalid",
        tokenPostfix: ".json5",

        // 转义字符
        escapes: /\\(?:[bfnrtv\\"\/]|u[0-9A-Fa-f]{4})/,

        // JSON5 支持的标记符号
        tokenizer: {
          root: [
            // 支持单行注释
            [/\/\/.*$/, "comment"],
            // 支持多行注释
            [/\/\*/, "comment", "@comment"],
            // 字符串
            [/"([^"\\]|\\.)*$/, "string.invalid"],
            [/'([^'\\]|\\.)*$/, "string.invalid"], // JSON5 支持单引号
            [/"/, "string", "@string_double"],
            [/'/, "string", "@string_single"], // JSON5 支持单引号
            // 数字
            [/[+-]?\d+\.\d+([eE][+-]?\d+)?/, "number.float"],
            [/[+-]?\d+[eE][+-]?\d+/, "number.float"],
            [/[+-]?\d+/, "number"],
            [/[+-]?Infinity/, "number"], // JSON5 支持 Infinity
            [/NaN/, "number"], // JSON5 支持 NaN
            // 布尔值
            [/true|false/, "keyword"],
            [/null/, "keyword"],
            [/undefined/, "keyword"], // JSON5 支持 undefined
            // 对象
            [/[{}]/, "delimiter.bracket"],
            [/[[\]]/, "delimiter.square"],
            [/,/, "delimiter.comma"],
            [/:/, "delimiter.colon"],
            // JSON5 支持标识符作为键名
            [/[a-zA-Z_$][\w$]*/, "identifier"],
            // 空白
            [/\s+/, "white"],
          ],
          string_double: [
            [/[^\\"]+/, "string"],
            [/@escapes/, "string.escape"],
            [/\\./, "string.escape.invalid"],
            [/"/, "string", "@pop"],
          ],
          string_single: [
            [/[^\\']+/, "string"],
            [/@escapes/, "string.escape"],
            [/\\./, "string.escape.invalid"],
            [/'/, "string", "@pop"],
          ],
          comment: [
            [/[^/*]+/, "comment"],
            [/\*\//, "comment", "@pop"],
            [/[/*]/, "comment"],
          ],
        },
      });
    }

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
        folding: true, // 确保启用代码折叠
      });

      onMount && onMount();

      editor.focus();

      // 监听折叠事件
      editor.onDidChangeModelContent(() => {
        // 在内容变化时更新折叠装饰器
        setTimeout(() => {
          updateFoldingDecorations();
        }, 100);
      });

      // 添加鼠标点击事件来捕获折叠操作
      editor.onMouseDown((e) => {
        // 用户点击后检查是否有折叠相关操作
        // 点击装订线(gutter)区域后更新折叠
        if (
          e.target.type ===
          monaco.editor.MouseTargetType.GUTTER_LINE_DECORATIONS
        ) {
          setTimeout(() => {
            updateFoldingDecorations();
          }, 100);
        }
      });

      // 监听内容变化
      editor.onDidChangeModelContent(async () => {
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
        }
        onUpdateValue(val);
      });

      // 添加粘贴事件监听
      editor.onDidPaste(async () => {});

      editorRef.current = editor;
    }
  };

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

  // 高亮错误行
  const highlightErrorLine = (lineNumber: number): boolean => {
    if (!editorRef.current) {
      return false;
    }
    // 滚动到错误行
    editorRef.current.revealLineInCenter(lineNumber);
    // 如果存在旧的装饰，先清除
    if (errorDecorationsRef.current) {
      errorDecorationsRef.current.clear();
    }

    // 创建新的装饰集合
    errorDecorationsRef.current = editorRef.current.createDecorationsCollection(
      [
        {
          range: new monaco.Range(lineNumber, 1, lineNumber, 1),
          options: {
            isWholeLine: true,
            className: "errorLineHighlight",
            glyphMarginClassName: "",
          },
        },
      ],
    );
    // 5秒后移除高亮
    setTimeout(() => {
      if (errorDecorationsRef.current) {
        errorDecorationsRef.current.clear();
      }
    }, 5000);

    return true;
  };

  // 一键定位到错误行
  const goToErrorLine = () => {
    if (!parseJsonError || parseJsonError.line <= 0) {
      toast.error("一键定位失败");

      return;
    }
    closeJsonErrorDetailsModel();

    highlightErrorLine(parseJsonError.line);
    toast.success("一键定位成功");
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
  }));

  useEffect(() => {
    // 使用 setTimeout 确保在 React 严格模式下只执行一次
    const timeoutId = setTimeout(() => {
      initializeEditor();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []); // 空依赖数组确保只在挂载时执行

  // 在模型或主题变化时更新装饰器
  useEffect(() => {
    if (editorRef.current) {
      updateFoldingDecorations();
    }
  }, [language, theme]);

  // 在组件卸载时清除定时器
  useEffect(() => {
    // 定义一个用于定期检查和更新折叠状态的定时器
    const foldingInterval = setInterval(() => {
      if (editorRef.current) {
        updateFoldingDecorations();
      }
    }, 2000); // 每2秒检查一次折叠状态

    return () => {
      if (foldingInterval) {
        clearInterval(foldingInterval);
      }
    };
  }, [editorRef.current]);

  // 添加自定义样式
  useEffect(() => {
    const styleElement = document.createElement("style");

    styleElement.textContent = `
      .inline-folded::after {
        content: attr(data-element-count) !important;
        background-color: #4CAF50 !important;
        color: white !important;
        border-radius: 3px;
        padding: 0 3px;
        margin-left: 4px;
      }
      
      /* 当没有元素计数数据时的备用显示 */
      .inline-folded:not([data-element-count])::after {
        content: "..." !important;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

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
          containerRef={rootContainerRef}
          currentFontSize={fontSize}
          currentLanguage={currentLanguage}
          tabKey={tabKey}
          onFontSizeChange={setFontSize}
          onLanguageChange={handleLanguageChange}
          onReset={handleReset}
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
