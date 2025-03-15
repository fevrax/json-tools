import { useRef, useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  Spinner,
  Chip,
  Select,
  SelectItem,
  Tooltip,
  Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import * as quicktype from "quicktype-core";

import toast from "@/utils/toast";
import MonacoEditor, {
  MonacoJsonEditorRef,
} from "@/components/monacoEditor/monacoJsonEditor";
import ToolboxPageTemplate from "@/layouts/toolboxPageTemplate";
import AIPromptOverlay from "@/components/ai/AIPromptOverlay.tsx";
import { useOpenAIConfigStore } from "@/store/useOpenAIConfigStore";
import { openAIService } from "@/services/openAIService";

// 支持的目标语言列表
const TARGET_LANGUAGES = [
  { value: "go", label: "Go", icon: "devicon:go" },
  { value: "typescript", label: "TypeScript", icon: "devicon:typescript" },
  { value: "javascript", label: "JavaScript", icon: "devicon:javascript" },
  { value: "java", label: "Java", icon: "devicon:java" },
  { value: "csharp", label: "C#", icon: "devicon:csharp" },
  { value: "python", label: "Python", icon: "devicon:python" },
  { value: "swift", label: "Swift", icon: "devicon:swift" },
  { value: "kotlin", label: "Kotlin", icon: "devicon:kotlin" },
  { value: "ruby", label: "Ruby", icon: "devicon:ruby" },
  { value: "rust", label: "Rust", icon: "devicon:rust" },
  { value: "php", label: "PHP", icon: "devicon:php" },
  { value: "plaintext", label: "plainText", icon: "weui:text-filled" },
];

export default function JsonTypeConverterPage() {
  const { theme } = useTheme();

  // 编辑器引用
  const inputEditorRef = useRef<MonacoJsonEditorRef>(null);
  const outputEditorRef = useRef<MonacoJsonEditorRef>(null);

  // 状态管理
  const [inputValue, setInputValue] = useState<string>("");
  const [outputValue, setOutputValue] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>("");

  // 选择的目标语言
  const [targetLanguage, setTargetLanguage] = useState<string>("typescript");

  // 使用 OpenAI 配置 store
  const { syncConfig } = useOpenAIConfigStore();

  // 初始化时同步配置
  useEffect(() => {
    syncConfig();
    // 同时也同步OpenAI服务的配置
    openAIService.syncConfig();
  }, [syncConfig]);

  // 重置函数
  const handleReset = () => {
    inputEditorRef.current?.updateValue("");
    outputEditorRef.current?.updateValue("");
    setInputValue("");
    setOutputValue("");
    toast.success("内容已清空");
  };

  // 使用quicktype进行类型转换
  const convertJsonToType = async () => {
    if (!inputValue) {
      toast.warning("请先输入内容");

      return;
    }

    setIsProcessing(true);
    setProcessingStep("正在处理转换...");

    try {
      // 解析输入内容
      let jsonInput = inputValue;

      // 验证JSON格式是否有效
      try {
        JSON.parse(jsonInput);
      } catch (e) {
        toast.error("无效的JSON格式");
        setIsProcessing(false);
        setProcessingStep("");

        return;
      }

      // 设置quicktype选项
      const quicktypeOptions = {
        lang: targetLanguage,
        inputData: jsonInput,
        inferMaps: true,
        inferEnums: true,
        inferDateTimes: true,
        alphabetizeProperties: true,
        allPropertiesOptional: false,
      };

      setProcessingStep("生成类型定义中...");

      // 调用quicktype API
      const { lines } = await quicktypeJSON(
        "GeneratedType", // 顶级类型名称
        jsonInput,
        quicktypeOptions.lang,
      );

      // 更新输出
      const result = lines.join("\n");

      setOutputValue(result);
      outputEditorRef.current?.updateValue(result);

      toast.success("转换成功");
      setProcessingStep("转换完成");
    } catch (error) {
      console.error("转换错误:", error);
      toast.error(`转换失败: ${(error as Error).message}`);
      setProcessingStep("");
    } finally {
      setIsProcessing(false);
    }
  };

  // 使用quicktype-core进行JSON到类型的转换
  async function quicktypeJSON(
    typeName: string,
    jsonString: string,
    lang: string,
  ) {
    const jsonInput = quicktype.jsonInputForTargetLanguage(lang);

    await jsonInput.addSource({
      name: typeName,
      samples: [jsonString],
    });

    const inputData = new quicktype.InputData();

    inputData.addInput(jsonInput);

    return await quicktype.quicktype({
      inputData,
      lang,
      rendererOptions: {
        "just-types": "true", // 仅生成类型，不生成额外代码
        "acronym-style": "original", // 保持原始大小写
      },
    });
  }

  // 复制输出内容
  const copyOutput = () => {
    if (!outputValue) {
      toast.warning("暂无内容可复制");

      return;
    }

    navigator.clipboard
      .writeText(outputValue)
      .then(() => toast.success("已复制到剪贴板"))
      .catch(() => toast.error("复制失败"));
  };

  // AI 转换处理函数
  const handleAiConvert = async () => {
    if (!inputValue) {
      toast.warning("请先输入 JSON 内容");
      return;
    }

    if (!prompt) {
      toast.warning("请输入转换需求");
      return;
    }

    setIsAiProcessing(true);
    setProcessingStep("正在处理转换...");

    try {
      // 构建提示词
      const promptText = `${prompt}\n以下是 JSON 内容：\n\`\`\`json\n${inputValue}\n\`\`\`\n请仅返回转换后的代码并使用\`\`\`语言标记\`\`\`包裹，不要包含任何解释或其他内容。`;

      if (promptText.length > openAIService.maxTokens) {
        toast.error("内容超出限制，请缩短内容或使用其他方式描述需求。");
        setProcessingStep("");
        setIsAiProcessing(false);

        return;
      }

      // 使用 OpenAI 服务
      await openAIService.createChatCompletion(
        [{ role: "user", content: promptText }],
        {
          onStart: () => {
            setProcessingStep("正在生成...");
          },
          onProcessing: (step) => {
            setProcessingStep(step);
          },
          onChunk: (_, accumulated) => {
            // // 清理结果，移除 markdown 格式标记
            // const cleanedResult = accumulated
            //   .replace(/^```[a-z]*\s*/i, "")
            //   .replace(/```\s*$/i, "")
            //   .trim();

            outputEditorRef.current?.updateValue(accumulated);
          },
          onComplete: (final) => {
            // 提取语言标记
            const langMatch = final.match(/^```([a-z]+)\s/i);
            let detectedLang = langMatch
              ? langMatch[1].toLowerCase()
              : targetLanguage;

            if (!detectedLang) {
              detectedLang = "plaintext";
            }
            console.log("Detected language:", detectedLang);
            // 清理结果，移除 markdown 格式标记
            const cleanedResult = final
              .replace(/^```[a-z]*\s*/i, "")
              .replace(/```\s*$/i, "")
              .trim();

            // 更新编辑器语言和内容
            outputEditorRef.current?.setLanguage(detectedLang);
            outputEditorRef.current?.updateValue(cleanedResult);
            setTargetLanguage(detectedLang);
            setOutputValue(cleanedResult);
            toast.success("转换成功");
            setProcessingStep("转换完成");
          },
          onError: () => {
            setProcessingStep("");
          },
        },
      );
    } catch (error) {
      console.error("AI转换错误:", error);
      toast.error(`转换失败: ${(error as Error).message}`);
    } finally {
      setIsAiProcessing(false);
      setIsAiModalOpen(false);
      setPrompt("");
    }
  };

  // 工具特定的操作按钮
  const actionButtons = (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        aria-label="目标语言"
        className="w-40 min-w-[160px]"
        color="secondary"
        selectedKeys={[targetLanguage]}
        size="sm"
        startContent={
          <Icon
            className="mr-1 text-secondary"
            icon={
              TARGET_LANGUAGES.find((l) => l.value === targetLanguage)?.icon ||
              ""
            }
            width={18}
          />
        }
        variant="faded"
        onChange={(e) => setTargetLanguage(e.target.value)}
      >
        {TARGET_LANGUAGES.map((lang) => (
          <SelectItem
            key={lang.value}
            startContent={<Icon className="mr-2" icon={lang.icon} width={18} />}
          >
            {lang.label}
          </SelectItem>
        ))}
      </Select>

      <Divider className="h-6" orientation="vertical" />

      <Button
        className="font-medium"
        color="secondary"
        isDisabled={isProcessing || isAiProcessing}
        size="sm"
        startContent={
          isAiProcessing ? (
            <Spinner color="current" size="sm" />
          ) : (
            <Icon icon="solar:magic-stick-linear" width={18} />
          )
        }
        variant="flat"
        onPress={() => setIsAiModalOpen(true)}
      >
        AI 转换
      </Button>

      <Button
        className="font-medium"
        color="primary"
        isDisabled={isProcessing || isAiProcessing || !inputValue}
        size="sm"
        startContent={
          isProcessing ? (
            <Spinner color="current" size="sm" />
          ) : (
            <Icon icon="solar:code-square-outline" width={18} />
          )
        }
        variant="flat"
        onPress={convertJsonToType}
      >
        生成类型
      </Button>

      <Button
        className="font-medium"
        color="success"
        isDisabled={!outputValue}
        size="sm"
        startContent={<Icon icon="solar:copy-outline" width={18} />}
        variant="flat"
        onPress={copyOutput}
      >
        复制结果
      </Button>

      <Button
        className="font-medium"
        color="danger"
        isDisabled={isProcessing || isAiProcessing}
        size="sm"
        startContent={<Icon icon="solar:restart-outline" width={18} />}
        variant="flat"
        onPress={handleReset}
      >
        重置
      </Button>
    </div>
  );

  // 状态指示器
  const statusIndicator = processingStep ? (
    <Chip
      className="px-3 transition-all duration-200"
      color={isProcessing ? "warning" : "success"}
      startContent={
        isProcessing ? (
          <Spinner className="mx-1" color="warning" size="sm" />
        ) : (
          <Icon className="mx-1" icon="icon-park-outline:success" width={16} />
        )
      }
      variant="flat"
    >
      {processingStep}
    </Chip>
  ) : null;

  return (
    <ToolboxPageTemplate
      actions={actionButtons}
      statusIndicator={statusIndicator}
      toolIcon="fluent-color:code-block-24"
      toolIconColor="text-primary"
      toolName="JSON 对象类型转换器"
    >
      <div className="flex flex-col h-full relative">
        <AIPromptOverlay
          isOpen={isAiModalOpen}
          isLoading={isAiProcessing}
          placeholderText="请输入您的需求，例如：'将这个 JSON 转换为 Go 结构体并添加 grom 字段定义，并添加中文注释'"
          prompt={prompt}
          tipText="提示: 您可以让AI将JSON转换为各种语言的类型定义或自定义结构"
          onClose={() => setIsAiModalOpen(false)}
          onPromptChange={setPrompt}
          onSubmit={handleAiConvert}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow h-0 overflow-hidden">
          <Card className="flex-1 overflow-hidden shadow-md border border-default-200 transition-shadow hover:shadow-lg">
            <CardBody className="p-0 h-full flex flex-col">
              <div className="p-2.5 bg-default-50 border-b border-default-200 flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Icon
                    className="text-default-600"
                    icon="solar:document-text-outline"
                    width={16}
                  />
                  输入 JSON
                </span>
                <Tooltip content="格式化" placement="top">
                  <Button
                    isIconOnly
                    aria-label="格式化"
                    className="bg-default-100/50 hover:bg-default-200/60"
                    size="sm"
                    variant="light"
                    onPress={() => {
                      inputEditorRef.current?.format();
                    }}
                  >
                    <Icon
                      className="text-default-600"
                      icon="solar:magic-stick-linear"
                      width={18}
                    />
                  </Button>
                </Tooltip>
              </div>
              <div className="flex-1 w-full h-full flex-grow overflow-hidden">
                <MonacoEditor
                  ref={inputEditorRef}
                  height="100%"
                  language="json"
                  tabKey="input"
                  theme={theme === "dark" ? "vs-dark" : "vs-light"}
                  value={inputValue}
                  onUpdateValue={(value) => setInputValue(value || "")}
                />
              </div>
            </CardBody>
          </Card>

          <Card className="flex-1 overflow-hidden shadow-md border border-default-200 transition-shadow hover:shadow-lg">
            <CardBody className="p-0 h-full flex flex-col">
              <div className="p-2.5 bg-default-50 border-b border-default-200 flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Icon
                    className="text-default-600"
                    icon="solar:code-square-linear"
                    width={16}
                  />
                  输出类型定义
                </span>
                <Button
                  isIconOnly
                  aria-label="复制"
                  className="bg-default-100/50 hover:bg-default-200/60"
                  size="sm"
                  variant="light"
                  onPress={copyOutput}
                >
                  <Icon
                    className="text-default-600"
                    icon="solar:copy-outline"
                    width={18}
                  />
                </Button>
              </div>
              <div className="flex-1 h-full flex-grow overflow-hidden">
                <MonacoEditor
                  ref={outputEditorRef}
                  height="100%"
                  language={targetLanguage}
                  tabKey="out"
                  theme={theme === "dark" ? "vs-dark" : "vs-light"}
                  value={outputValue}
                  onUpdateValue={() => {}}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </ToolboxPageTemplate>
  );
}
