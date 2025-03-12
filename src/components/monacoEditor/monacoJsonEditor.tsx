import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { loader, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import {
  Button,
  cn,
  useDisclosure,
  Select,
  SelectItem,
  Slider,
} from "@heroui/react";
import { editor } from "monaco-editor";
import { jsonrepair } from "jsonrepair";
import { Icon } from "@iconify/react";
import JSON5 from "json5";

import toast from "@/utils/toast";
// eslint-disable-next-line import/order
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
import ErrorModal from "@/components/monacoEditor/errorModal.tsx";

export interface MonacoJsonEditorProps {
  tabTitle?: string;
  tabKey: string;
  height?: number | string;
  value?: string;
  language?: string;
  theme?: string;
  isSetting?: boolean; // 是否显示设置按钮
  isMenu?: boolean; // 是否显示悬浮菜单按钮
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
}

// 定义菜单位置类型
interface MenuPosition {
  x: number;
  y: number;
}

// 定义支持的语言列表
const SUPPORTED_LANGUAGES = [
  { id: "json", name: "JSON" },
  { id: "json5", name: "JSON5" },
  { id: "javascript", name: "JavaScript" },
  { id: "typescript", name: "TypeScript" },
  { id: "html", name: "HTML" },
  { id: "css", name: "CSS" },
  { id: "python", name: "Python" },
  { id: "java", name: "Java" },
  { id: "csharp", name: "C#" },
  { id: "cpp", name: "C++" },
  { id: "markdown", name: "Markdown" },
  { id: "yaml", name: "YAML" },
  { id: "xml", name: "XML" },
  { id: "sql", name: "SQL" },
  { id: "shell", name: "Shell" },
];

// 拖动菜单组件
const DraggableMenu: React.FC<{
  containerRef: React.RefObject<HTMLDivElement>;
  onLanguageChange: (language: string) => void;
  onFontSizeChange: (fontSize: number) => void;
  onReset: () => void;
  currentLanguage: string;
  currentFontSize: number;
}> = ({
  containerRef,
  onLanguageChange,
  onFontSizeChange,
  onReset,
  currentLanguage,
  currentFontSize,
}) => {
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    x: 20,
    y: 20,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // 设置初始位置到右下角
  useEffect(() => {
    if (containerRef.current && menuRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();

      setMenuPosition({
        x: containerRect.width - menuRect.width - 20, // 右边距离20px
        y: containerRect.height - menuRect.height - 20, // 底部距离20px
      });
    }
  }, []);

  // 启动拖动操作
  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: clientX - menuPosition.x,
      y: clientY - menuPosition.y,
    };
  };

  // 处理拖动过程
  const handleDrag = (clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current?.getBoundingClientRect();

    if (!menuRect) return;

    // 计算新位置，确保不超出容器边界
    const newX = Math.max(
      0,
      Math.min(
        clientX - dragStartRef.current.x,
        containerRect.width - menuRect.width,
      ),
    );
    const newY = Math.max(
      0,
      Math.min(
        clientY - dragStartRef.current.y,
        containerRect.height - menuRect.height,
      ),
    );

    setMenuPosition({ x: newX, y: newY });
  };

  // 完成拖动操作
  const finishDrag = () => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // 监听全局鼠标事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDrag(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      finishDrag();
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }

    return undefined;
  }, [isDragging, menuPosition]);

  // 点击菜单外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        isMenuOpen
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div
      ref={menuRef}
      aria-label="编辑器设置菜单"
      className={cn(
        "absolute z-50 transition-opacity",
        isDragging ? "cursor-grabbing" : "cursor-grab",
      )}
      role="region"
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
      }}
    >
      {/* 拖动手柄区域 */}
      <div
        aria-label="拖动菜单"
        className="absolute -top-3 -left-3 -right-3 -bottom-3 cursor-grab"
        role="button"
        style={{
          touchAction: "none",
          zIndex: -1,
        }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
          }
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startDrag(e.clientX, e.clientY);
        }}
      />

      {/* 菜单按钮 */}
      <div
        ref={buttonRef}
        aria-expanded={isMenuOpen}
        aria-label="打开设置菜单"
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-full shadow-lg cursor-pointer",
          "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
          "transform transition-all duration-300 hover:scale-110",
          "ring-2 ring-white/50 hover:ring-white/80 dark:ring-blue-400/50 dark:hover:ring-blue-400/80",
          "dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800",
          isMenuOpen ? "rotate-180" : "",
        )}
        role="button"
        tabIndex={0}
        onClick={toggleMenu}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleMenu();
          }
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startDrag(e.clientX, e.clientY);
        }}
      >
        <Icon
          className="text-white w-5 h-5"
          icon="heroicons:cog-6-tooth"
          style={{
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          }}
        />
      </div>

      {/* 菜单面板 */}
      <div
        className={cn(
          "absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-64 transition-all duration-300",
          isMenuOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none",
        )}
        style={{
          bottom: "calc(100% + 8px)",
          right: 0,
          transformOrigin: "bottom right",
        }}
      >
        <div className="flex flex-col space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              htmlFor="language-select"
            >
              编程语言
            </label>
            <Select
              id="language-select"
              selectedKeys={[currentLanguage]}
              size="sm"
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.id}>{lang.name}</SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              htmlFor="font-size-slider"
            >
              字体大小: {currentFontSize}px
            </label>
            <Slider
              className="w-full"
              id="font-size-slider"
              maxValue={24}
              minValue={12}
              size="sm"
              step={1}
              value={currentFontSize}
              onChange={(value) => onFontSizeChange(value as number)}
            />
          </div>

          <Button
            color="primary"
            size="sm"
            startContent={<Icon icon="heroicons:arrow-path" width={16} />}
            onPress={onReset}
          >
            重置设置
          </Button>
        </div>
      </div>
    </div>
  );
};

const MonacoJsonEditor: React.FC<MonacoJsonEditorProps> = ({
  value,
  tabKey,
  tabTitle,
  language,
  theme,
  height,
  isMenu = false,
  onUpdateValue,
  onMount,
  ref,
}) => {
  const errorBottomHeight = 45; // 底部错误详情弹窗的高度
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [parseJsonError, setParseJsonError] = useState<JsonErrorInfo | null>(
    null,
  );
  const parseJsonErrorShow = useRef<boolean>(false);
  const parseJsonErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorLayoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorDecorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);

  // 菜单状态
  const [currentLanguage, setCurrentLanguage] = useState(language || "json");
  const [fontSize, setFontSize] = useState(() => {
    const savedFontSize = localStorage.getItem("monacoEditorFontSize");

    return savedFontSize ? parseInt(savedFontSize) : 14; // 默认字体大小
  });

  const {
    isOpen: jsonErrorDetailsModel,
    onOpen: openJsonErrorDetailsModel,
    onClose: closeJsonErrorDetailsModel,
  } = useDisclosure();

  // 计算编辑器实际高度，当有错误时减去错误信息栏的高度
  const getEditorHeight = () => {
    if (typeof height === "number") {
      return parseJsonError ? height - errorBottomHeight : height;
    }

    // 如果height是字符串（例如'100%'），需要保持容器高度为传入值，并在内部进行调整
    return parseJsonError ? `calc(${height} - ${errorBottomHeight}px)` : height;
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
      // 保存字体大小到localStorage
      localStorage.setItem("monacoEditorFontSize", fontSize.toString());
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
    handleLanguageChange(language || "json"); // 重置语言

    // 清除保存的位置
    localStorage.removeItem("monacoEditorMenuPosition");
    localStorage.removeItem("monacoEditorFontSize");

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
          enabled: true, // 启用缩略图
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
      });

      onMount && onMount();

      editor.focus();

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

  return (
    <div className="flex flex-col relative" style={{ height: height }}>
      <div
        ref={containerRef}
        className={cn("w-full flex-grow flex-1 relative")}
        style={{ height: getEditorHeight(), transition: "height 0.1s ease" }}
      />

      {/* 可拖动悬浮菜单 */}
      {isMenu && (
        <DraggableMenu
          containerRef={containerRef}
          currentFontSize={fontSize}
          currentLanguage={currentLanguage}
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
