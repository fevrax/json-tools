import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { loader, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { Button, cn, useDisclosure } from "@heroui/react";
import { editor } from "monaco-editor";
import { jsonrepair } from "jsonrepair";
import { Icon } from "@iconify/react";
import JSON5 from "json5";

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
import { OpenAIService } from "@/services/openAIService";

import "@/styles/monaco.css";
import ErrorModal from "@/components/monacoEditor/errorModal.tsx";
import DraggableMenu from "@/components/monacoEditor/draggableMenu";
import AIPromptOverlay from "@/components/ai/AIPromptOverlay";

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
  onUpdateValue,
  onMount,
  ref,
}) => {
  const { getTabByKey } = useTabStore();
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

  // AI相关状态
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiResponse, setShowAiResponse] = useState(false);
  const aiEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const aiContainerRef = useRef<HTMLDivElement>(null);

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
            value: "", // 不再设置初始值为"AI正在思考中..."
            language: "go",
            readOnly: true,
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
          },
        );
      } else if (aiEditorRef.current) {
        // 不再设置"AI正在思考中..."
      }

      // 更新两个编辑器布局
      editorRef.current?.layout();
      aiEditorRef.current?.layout();

      // 使用OpenAI服务
      const openAiService = OpenAIService.createInstance();

      // 修复TypeScript类型问题，确保与ChatCompletionMessageParam兼容
      const messages = [
        {
          role: "system" as const,
          content:
            "您是一个JSON工具助手，请帮助用户解决JSON相关问题，请仅返回数据或代码并使用\\`\\`\\`语言标记\\`\\`\\`包裹，不要包含任何解释或其他内容。",
        },
        {
          role: "user" as const,
          content: `${aiPrompt}\n\n以下是用户的JSON数据:\n\`\`\`json\n${editorRef.current?.getValue() || ""}\n\`\`\``,
        },
      ];

      if (messages[1].content.length > openAiService.maxTokens) {
        toast.error("内容超出限制，请缩短内容或使用其他方式描述需求。");
        return;
      }

      try {
        // 检查是否已取消
        if (controller.signal.aborted) {
          return;
        }

        await openAiService.createChatCompletion(messages, {
          onStart: () => {
            // 不再设置"AI正在思考中..."
          },
          onChunk: (_chunk, accumulated) => {
            // 检查是否已取消
            if (controller.signal.aborted) {
              throw new Error("已取消生成");
            }
            setAiResponse(accumulated);
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

            // 清理结果，移除 markdown 格式标记
            const cleanedResult = final
              .replace(/^```[a-z]*\s*/i, "")
              .replace(/```\s*$/i, "")
              .trim();

            setTimeout(() => {
              const model = monaco.editor.createModel(
                cleanedResult as string,
                detectedLang || "json",
              );

              if (aiEditorRef.current) {
                aiEditorRef.current.setModel(model);
              }
            }, 100);

            setAiResponse(final);
            setIsAiLoading(false);
            // 清除控制器引用
            (window as any).currentAiController = null;
          },
          onError: (error) => {
            setIsAiLoading(false);
            // 如果是取消错误，显示不同的消息
            if (error.message === "已取消生成") {
              toast.warning(`AI解析已取消`);
              // 不再修改编辑器内容
            } else {
              toast.error(`AI回复错误: ${error.message}`);
              setAiResponse(`处理出错: ${error.message}`);
              if (aiEditorRef.current) {
                aiEditorRef.current.setValue(`处理出错: ${error.message}`);
              }
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
  const closeAiResponse = () => {
    setShowAiResponse(false);
    setAiResponse("");

    // 布局调整
    setTimeout(() => {
      editorRef.current?.layout();
    }, 100);
  };

  // 监听AI响应状态变化，更新编辑器布局
  useEffect(() => {
    if (showAiResponse) {
      setTimeout(() => {
        editorRef.current?.layout();
        aiEditorRef.current?.layout();
      }, 200);
    }
  }, [showAiResponse, isAiLoading]);

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

    if (aiEditorRef.current) {
      aiEditorRef.current.updateOptions({
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

    if (aiEditorRef.current) {
      aiEditorRef.current.updateOptions({
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

    // 不再更新AI编辑器的语言

    if (editorFormat()) {
      setParseJsonError(null);
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
      aiEditorRef.current?.layout();
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
      if (aiEditorRef.current) {
        aiEditorRef.current.layout();
      }
    },
    showAiPrompt: () => {
      setShowAiPrompt(true);
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
    <div className="flex flex-col relative w-full h-full" style={{ height }}>
      {/* 使用AIPromptOverlay组件 */}
      <AIPromptOverlay
        isLoading={isAiLoading}
        isOpen={showAiPrompt}
        placeholderText="向AI提问关于当前JSON的问题..."
        prompt={aiPrompt}
        onClose={() => setShowAiPrompt(false)}
        onPromptChange={setAiPrompt}
        onSubmit={handleAiSubmit}
      />

      {/* 编辑器外层容器 */}
      <div
        className={cn(
          "w-full flex-1",
          showAiResponse ? "flex flex-row" : "flex flex-col",
        )}
        style={{ height: getEditorHeight() }}
      >
        {showAiResponse ? (
          // AI响应模式：显示左右两个编辑器
          <>
            {/* 用户输入的编辑器 - 左侧 */}
            <div className="flex-1 h-full" style={{ width: "50%" }}>
              <div ref={containerRef} className="h-full w-full" />
            </div>

            {/* 垂直分隔线 */}
            <div className="flex flex-col justify-center h-full px-1.5">
              <div className="h-[80%] w-[2px] bg-gradient-to-b from-blue-300/50 via-purple-300/50 to-indigo-300/50 dark:from-blue-500/40 dark:via-purple-500/40 dark:to-indigo-500/40 rounded-full shadow-[0_0_4px_rgba(59,130,246,0.3)] dark:shadow-[0_0_4px_rgba(99,102,241,0.4)]" />
            </div>

            {/* AI响应编辑器 - 右侧 */}
            <div className="flex-1 h-full" style={{ width: "50%" }}>
              <div className="flex flex-col h-full border-l border-blue-100 dark:border-blue-800 shadow-lg dark:shadow-blue-900/20 overflow-hidden">
                <div className="flex justify-between items-center px-3 py-2.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-blue-50/80 dark:from-blue-950/80 dark:via-indigo-950/80 dark:to-blue-950/80 backdrop-blur-sm border-b border-blue-100 dark:border-blue-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="relative">
                      <Icon
                        className="text-blue-600 dark:text-blue-400"
                        icon="hugeicons:ai-chat-02"
                        width={20}
                      />
                      {isAiLoading && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                      )}
                    </div>
                    <span className="text-sm font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      AI助手解析结果
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
                    <Button
                      isIconOnly
                      className="bg-blue-50 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-800/40 rounded-full"
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
                <div
                  ref={aiContainerRef}
                  className="flex-1 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm"
                  style={{ height: "calc(100% - 45px)" }}
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
          containerRef={containerRef}
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
