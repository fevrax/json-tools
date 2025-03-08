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
import YAML from "js-yaml";
import { xml2js, js2xml } from "xml-js";
// @ts-ignore
import TOML from "@iarna/toml";

import toast from "@/utils/toast";
import MonacoEditor, {
  MonacoJsonEditorRef,
} from "@/components/monacoEditor/monacoJsonEditor";
import ToolboxPageTemplate from "@/layouts/toolboxPageTemplate";
import AIPromptModal from "@/components/ai/AIPromptModal.tsx";
import { useOpenAIConfigStore } from "@/store/useOpenAIConfigStore";
import { openAIService } from "@/services/openAIService";

// 支持的数据格式
const DATA_FORMATS = [
  { value: "json", label: "JSON", icon: "vscode-icons:file-type-json" },
  { value: "yaml", label: "YAML", icon: "vscode-icons:file-type-yaml" },
  { value: "xml", label: "XML", icon: "vscode-icons:file-type-xml" },
  { value: "toml", label: "TOML", icon: "vscode-icons:file-type-toml" },
];

export default function DataFormatConverterPage() {
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

  // 数据格式转换相关状态
  const [inputFormat, setInputFormat] = useState<string>("json");
  const [outputFormat, setOutputFormat] = useState<string>("yaml");

  // 使用 OpenAI 配置 store
  const { syncConfig } = useOpenAIConfigStore();

  // 初始化时同步配置
  useEffect(() => {
    syncConfig();
    openAIService.syncConfig();
  }, [syncConfig]);

  // 重置函数
  const handleReset = () => {
    setInputValue("");
    setOutputValue("");
    outputEditorRef.current?.updateValue("");
    inputEditorRef.current?.updateValue("");
    toast.success("内容已清空");
  };

  // 交换输入和输出格式
  const handleSwapFormats = () => {
    setInputFormat(outputFormat);
    setOutputFormat(inputFormat);

    if (outputValue) {
      setInputValue(outputValue);
      setOutputValue("");
    }
  };

  // 数据格式转换函数
  const convertDataFormat = async () => {
    if (!inputValue) {
      toast.warning("请先输入内容");

      return;
    }

    setIsProcessing(true);
    setProcessingStep("正在处理转换...");

    try {
      // 将输入格式转换为JSON对象
      let jsonData;

      try {
        switch (inputFormat) {
          case "json":
            jsonData = JSON.parse(inputValue);
            break;
          case "yaml":
            jsonData = YAML.load(inputValue);
            break;
          case "xml":
            jsonData = xml2js(inputValue, { compact: true });
            break;
          case "toml":
            jsonData = TOML.parse(inputValue);
            break;
          default:
            throw new Error(`不支持的输入格式: ${inputFormat}`);
        }
      } catch (e) {
        toast.error(
          `无效的${inputFormat.toUpperCase()}格式: ${(e as Error).message}`,
        );
        setIsProcessing(false);
        setProcessingStep("");

        return;
      }

      // 将JSON对象转换为目标格式
      let result;

      try {
        switch (outputFormat) {
          case "json":
            result = JSON.stringify(jsonData, null, 2);
            break;
          case "yaml":
            result = YAML.dump(jsonData);
            break;
          case "xml":
            result = js2xml(jsonData, { compact: true, spaces: 2 });
            break;
          case "toml":
            result = TOML.stringify(jsonData);
            break;
          default:
            throw new Error(`不支持的输出格式: ${outputFormat}`);
        }
      } catch (e) {
        toast.error(
          `转换到${outputFormat.toUpperCase()}失败: ${(e as Error).message}`,
        );
        setIsProcessing(false);
        setProcessingStep("");

        return;
      }

      // 更新输出
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

  // 复制输出内容
  const copyOutput = () => {
    if (!outputValue) {
      toast.warning("暂无内容可复制");

      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(outputValue)
        .then(() => toast.success("已复制到剪贴板"))
        .catch(() => toast.error("复制失败"));
    } else {
      toast.error("复制失败");
    }
  };

  // 复制输入内容
  const copyInput = () => {
    if (!inputValue) {
      toast.warning("暂无内容可复制");

      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(inputValue)
        .then(() => toast.success("已复制到剪贴板"))
        .catch(() => toast.error("复制失败"));
    } else {
      toast.error("复制失败");
    }
  };

  // 格式化输入内容
  const formatInput = () => {
    inputEditorRef.current?.format();
  };

  // 格式化输出内容
  const formatOutput = () => {
    if (!outputValue) {
      toast.warning("暂无内容可格式化");

      return;
    }

    try {
      let formattedOutput = outputValue;

      switch (outputFormat) {
        case "json":
          const jsonObj = JSON.parse(outputValue);

          formattedOutput = JSON.stringify(jsonObj, null, 2);
          break;
        case "yaml":
          // YAML已经是格式化的，但可以重新解析确保格式一致
          const yamlObj = YAML.load(outputValue);

          formattedOutput = YAML.dump(yamlObj);
          break;
        case "xml":
          // 简单的XML格式化，可能需要更复杂的实现
          formattedOutput = outputValue
            .replace(/></g, ">\n<")
            .replace(/><\/(\w+)>/g, ">\n</$1>");
          break;
        case "toml":
          // TOML格式化可能需要特殊处理
          break;
        default:
          break;
      }

      setOutputValue(formattedOutput);
      toast.success("格式化成功");
    } catch (error) {
      toast.error(`格式化失败: ${(error as Error).message}`);
    }
  };

  // AI 转换处理函数
  const handleAiConvert = async (prompt: string) => {
    if (!inputValue) {
      toast.warning("请先输入内容");

      return;
    }

    setIsAiProcessing(true);
    setProcessingStep("正在处理转换...");

    try {
      // 构建提示词
      const promptText = `${prompt}\n以下是${DATA_FORMATS.find((f) => f.value === inputFormat)?.label || inputFormat}内容：\n\`\`\`${inputFormat}\n${inputValue}\n\`\`\`\n请仅返回转换后的代码并使用\`\`\`语言标记\`\`\`包裹，不要包含任何解释或其他内容。`;

      if (promptText.length > 2000) {
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
            outputEditorRef.current?.updateValue(accumulated);
          },
          onComplete: (final) => {
            // 提取语言标记
            const langMatch = final.match(/^```([a-z]+)\s/i);
            let detectedLang = langMatch
              ? langMatch[1].toLowerCase()
              : outputFormat;

            if (!detectedLang) {
              detectedLang = "yaml";
            }
            // 清理结果，移除 markdown 格式标记
            const cleanedResult = final
              .replace(/^```[a-z]*\s*/i, "")
              .replace(/```\s*$/i, "")
              .trim();

            // 更新编辑器语言和内容
            outputEditorRef.current?.updateValue(cleanedResult);
            setOutputFormat(detectedLang);
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
    }
  };

  // 格式转换操作按钮
  const formatConversionButtons = (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        aria-label="输入格式"
        className="w-32 min-w-[120px]"
        color="primary"
        selectedKeys={[inputFormat]}
        size="sm"
        startContent={
          <Icon
            className="mr-1 text-primary"
            icon={DATA_FORMATS.find((f) => f.value === inputFormat)?.icon || ""}
            width={18}
          />
        }
        variant="faded"
        onChange={(e) => {
          setInputFormat(e.target.value);
          inputEditorRef.current?.setLanguage(e.target.value);
        }}
      >
        {DATA_FORMATS.map((format) => (
          <SelectItem
            key={format.value}
            startContent={
              <Icon className="mr-2" icon={format.icon} width={18} />
            }
          >
            {format.label}
          </SelectItem>
        ))}
      </Select>

      <Button
        isIconOnly
        aria-label="交换格式"
        className="bg-default-100/50 hover:bg-default-200/60"
        size="sm"
        variant="light"
        onPress={handleSwapFormats}
      >
        <Icon
          className="text-default-600"
          icon="solar:refresh-linear"
          width={18}
        />
      </Button>

      <Select
        aria-label="输出格式"
        className="w-32 min-w-[120px]"
        color="secondary"
        selectedKeys={[outputFormat]}
        size="sm"
        startContent={
          <Icon
            className="mr-1 text-secondary"
            icon={
              DATA_FORMATS.find((f) => f.value === outputFormat)?.icon || ""
            }
            width={18}
          />
        }
        variant="faded"
        onChange={(e) => {
          setOutputFormat(e.target.value);
          outputEditorRef.current?.setLanguage(e.target.value);
        }}
      >
        {DATA_FORMATS.map((format) => (
          <SelectItem
            key={format.value}
            startContent={
              <Icon className="mr-2" icon={format.icon} width={18} />
            }
          >
            {format.label}
          </SelectItem>
        ))}
      </Select>

      <Divider className="h-6" orientation="vertical" />

      <Button
        className="font-medium"
        color="primary"
        isDisabled={isProcessing || isAiProcessing || !inputValue}
        size="sm"
        startContent={
          isProcessing ? (
            <Spinner color="current" size="sm" />
          ) : (
            <Icon icon="solar:refresh-outline" width={18} />
          )
        }
        variant="flat"
        onPress={convertDataFormat}
      >
        转换格式
      </Button>

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

  // 工具特定的操作按钮
  const actionButtons = (
    <div className="flex flex-col gap-3 w-full">
      <AIPromptModal
        isOpen={isAiModalOpen}
        isProcessing={isAiProcessing}
        placeholder="请输入您的需求，例如：'将这个 JSON 转换为 Go 结构体并添加 grom 字段定义，并添加中文注释'"
        submitButtonText="开始转换"
        title="AI 智能转换"
        onClose={() => setIsAiModalOpen(false)}
        onSubmit={handleAiConvert}
      />
      <div className="flex items-center gap-2 flex-wrap">
        {formatConversionButtons}
      </div>
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
      toolIcon="token-branded:swap"
      toolIconColor="text-primary"
      toolName="数据格式转换工具"
    >
      <div className="flex flex-col h-full">
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
                  输入{" "}
                  {DATA_FORMATS.find((f) => f.value === inputFormat)?.label ||
                    inputFormat}
                </span>
                <div className="flex items-center gap-1">
                  <Tooltip content="格式化" placement="top">
                    <Button
                      isIconOnly
                      aria-label="格式化"
                      className="bg-default-100/50 hover:bg-default-200/60"
                      size="sm"
                      variant="light"
                      onPress={formatInput}
                    >
                      <Icon
                        className="text-default-600"
                        icon="solar:magic-stick-linear"
                        width={18}
                      />
                    </Button>
                  </Tooltip>
                  <Tooltip content="复制" placement="top">
                    <Button
                      isIconOnly
                      aria-label="复制"
                      className="bg-default-100/50 hover:bg-default-200/60"
                      size="sm"
                      variant="light"
                      onPress={copyInput}
                    >
                      <Icon
                        className="text-default-600"
                        icon="solar:copy-outline"
                        width={18}
                      />
                    </Button>
                  </Tooltip>
                </div>
              </div>
              <div className="flex-1 w-full h-full flex-grow overflow-hidden">
                <MonacoEditor
                  ref={inputEditorRef}
                  height="100%"
                  language={inputFormat}
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
                  输出{" "}
                  {DATA_FORMATS.find((f) => f.value === outputFormat)?.label ||
                    outputFormat}
                </span>
                <div className="flex items-center gap-1">
                  <Tooltip content="格式化" placement="top">
                    <Button
                      isIconOnly
                      aria-label="格式化"
                      className="bg-default-100/50 hover:bg-default-200/60"
                      size="sm"
                      variant="light"
                      onPress={formatOutput}
                    >
                      <Icon
                        className="text-default-600"
                        icon="solar:magic-stick-linear"
                        width={18}
                      />
                    </Button>
                  </Tooltip>
                  <Tooltip content="复制" placement="top">
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
                  </Tooltip>
                </div>
              </div>
              <div className="flex-1 h-full flex-grow overflow-hidden">
                <MonacoEditor
                  ref={outputEditorRef}
                  height="100%"
                  language={outputFormat}
                  tabKey="out"
                  theme={theme === "dark" ? "vs-dark" : "vs-light"}
                  value={outputValue}
                  onUpdateValue={(val) => {
                    setOutputValue(val || "");
                  }}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </ToolboxPageTemplate>
  );
}
