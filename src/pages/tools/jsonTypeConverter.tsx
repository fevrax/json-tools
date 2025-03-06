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
];

export default function JsonTypeConverterPage() {
  const { theme } = useTheme();

  // 编辑器引用
  const inputEditorRef = useRef<MonacoJsonEditorRef>(null);
  const outputEditorRef = useRef<MonacoJsonEditorRef>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState<number>(500);

  // 状态管理
  const [inputValue, setInputValue] = useState<string>("");
  const [outputValue, setOutputValue] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>("");

  // 选择的目标语言
  const [targetLanguage, setTargetLanguage] = useState<string>("typescript");

  // 计算编辑器高度
  useEffect(() => {
    const updateEditorHeight = () => {
      if (editorContainerRef.current) {
        const availableHeight =
          window.innerHeight -
          editorContainerRef.current.getBoundingClientRect().top -
          40; // 40px 底部边距

        setEditorHeight(Math.max(400, availableHeight));
      }
    };

    updateEditorHeight();
    window.addEventListener("resize", updateEditorHeight);

    return () => {
      window.removeEventListener("resize", updateEditorHeight);
    };
  }, []);

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
        color="primary"
        isDisabled={isProcessing || !inputValue}
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
        isDisabled={isProcessing}
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
      toolIcon="solar:code-square-bold"
      toolIconColor="text-primary"
      toolName="JSON 类型转换工具"
    >
      <div
        ref={editorContainerRef}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full"
        style={{ minHeight: `${editorHeight}px` }}
      >
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
            <div
              className="flex-1"
              style={{ height: `${editorHeight - 50}px` }}
            >
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
            <div
              className="flex-1"
              style={{ height: `${editorHeight - 50}px` }}
            >
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
    </ToolboxPageTemplate>
  );
}
