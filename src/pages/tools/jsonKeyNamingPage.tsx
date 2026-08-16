import { useRef, useState } from "react";
import { Button, Card, CardBody, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";

import toast from "@/utils/toast";
import MonacoEditor, {
  MonacoJsonEditorRef,
} from "@/components/monacoEditor/MonacoJsonEditor.tsx";
import ToolboxPageTemplate from "@/layouts/toolboxPageTemplate";
import {
  convertJsonKeys,
  KeyNamingCollisionError,
  type KeyNamingCollision,
  type NamingFormat,
} from "@/utils/keyNamingConverter";

const FORMAT_OPTIONS: {
  format: NamingFormat;
  label: string;
  displayText: string;
  example: string;
  icon: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveHoverBg: string;
  inactiveHoverBorder: string;
  inactiveIconColor: string;
  activeBg: string;
  activeBorder: string;
  activeShadow: string;
}[] = [
  {
    format: "camel",
    label: "小驼峰",
    displayText: "转小驼峰",
    example: "firstName",
    icon: "solar:arrow-right-linear",
    inactiveBg: "bg-primary-50 dark:bg-primary-950/30",
    inactiveBorder: "border-primary-200 dark:border-primary-800/40",
    inactiveHoverBg: "hover:bg-primary-100 dark:hover:bg-primary-900/40",
    inactiveHoverBorder:
      "hover:border-primary-300 dark:hover:border-primary-700/60",
    inactiveIconColor: "text-primary-400",
    activeBg: "bg-gradient-to-br from-primary-500 to-primary-600",
    activeBorder: "border-primary-500",
    activeShadow: "shadow-primary-300/50 dark:shadow-primary-900/50",
  },
  {
    format: "pascal",
    label: "大驼峰",
    displayText: "转大驼峰",
    example: "FirstName",
    icon: "solar:arrow-right-linear",
    inactiveBg: "bg-secondary-50 dark:bg-secondary-950/30",
    inactiveBorder: "border-secondary-200 dark:border-secondary-800/40",
    inactiveHoverBg: "hover:bg-secondary-100 dark:hover:bg-secondary-900/40",
    inactiveHoverBorder:
      "hover:border-secondary-300 dark:hover:border-secondary-700/60",
    inactiveIconColor: "text-secondary-400",
    activeBg: "bg-gradient-to-br from-secondary-500 to-secondary-600",
    activeBorder: "border-secondary-500",
    activeShadow: "shadow-secondary-300/50 dark:shadow-secondary-900/50",
  },
  {
    format: "snake",
    label: "小写+下划线",
    displayText: "转下划线",
    example: "first_name",
    icon: "solar:arrow-right-linear",
    inactiveBg: "bg-success-50 dark:bg-success-950/30",
    inactiveBorder: "border-success-200 dark:border-success-800/40",
    inactiveHoverBg: "hover:bg-success-100 dark:hover:bg-success-900/40",
    inactiveHoverBorder:
      "hover:border-success-300 dark:hover:border-success-700/60",
    inactiveIconColor: "text-success-400",
    activeBg: "bg-gradient-to-br from-success-500 to-success-600",
    activeBorder: "border-success-500",
    activeShadow: "shadow-success-300/50 dark:shadow-success-900/50",
  },
  {
    format: "kebab",
    label: "短横线",
    displayText: "转短横线",
    example: "first-name",
    icon: "solar:arrow-right-linear",
    inactiveBg: "bg-warning-50 dark:bg-warning-950/30",
    inactiveBorder: "border-warning-200 dark:border-warning-800/40",
    inactiveHoverBg: "hover:bg-warning-100 dark:hover:bg-warning-900/40",
    inactiveHoverBorder:
      "hover:border-warning-300 dark:hover:border-warning-700/60",
    inactiveIconColor: "text-warning-400",
    activeBg: "bg-gradient-to-br from-warning-500 to-warning-600",
    activeBorder: "border-warning-500",
    activeShadow: "shadow-warning-300/50 dark:shadow-warning-900/50",
  },
  {
    format: "constant",
    label: "大写+下划线",
    displayText: "转常量",
    example: "FIRST_NAME",
    icon: "solar:arrow-right-linear",
    inactiveBg: "bg-danger-50 dark:bg-danger-950/30",
    inactiveBorder: "border-danger-200 dark:border-danger-800/40",
    inactiveHoverBg: "hover:bg-danger-100 dark:hover:bg-danger-900/40",
    inactiveHoverBorder:
      "hover:border-danger-300 dark:hover:border-danger-700/60",
    inactiveIconColor: "text-danger-400",
    activeBg: "bg-gradient-to-br from-danger-500 to-danger-600",
    activeBorder: "border-danger-500",
    activeShadow: "shadow-danger-300/50 dark:shadow-danger-900/50",
  },
];

export default function JsonKeyNamingPage() {
  const { theme } = useTheme();
  const inputEditorRef = useRef<MonacoJsonEditorRef>(null);
  const outputEditorRef = useRef<MonacoJsonEditorRef>(null);

  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");
  const [activeFormat, setActiveFormat] = useState<NamingFormat | null>(null);
  const [collisions, setCollisions] = useState<KeyNamingCollision[]>([]);

  const clearConversionResult = () => {
    setOutputValue("");
    outputEditorRef.current?.updateValue("");
    setActiveFormat(null);
  };

  const handleConvert = (format: NamingFormat) => {
    if (!inputValue.trim()) {
      toast.warning("请先输入 JSON 内容");

      return;
    }

    try {
      const result = convertJsonKeys(inputValue, format, 2);

      setOutputValue(result);
      outputEditorRef.current?.updateValue(result);
      setActiveFormat(format);
      setCollisions([]);
      toast.success(
        `已转换为${FORMAT_OPTIONS.find((f) => f.format === format)?.label}`,
      );
    } catch (e) {
      clearConversionResult();

      if (e instanceof KeyNamingCollisionError) {
        setCollisions(e.collisions);
        const first = e.collisions[0];

        toast.error(
          "字段命名冲突，已中止转换",
          `${first.path}: ${first.sourceKeys.join("、")} → ${first.targetKey}`,
        );

        return;
      }

      setCollisions([]);
      toast.error(`JSON 解析失败: ${(e as Error).message}`);
    }
  };

  const handleReset = () => {
    setInputValue("");
    setOutputValue("");
    setActiveFormat(null);
    setCollisions([]);
    inputEditorRef.current?.updateValue("");
    outputEditorRef.current?.updateValue("");
    toast.success("内容已清空");
  };

  const copyToClipboard = (text: string) => {
    if (!text) {
      toast.warning("暂无内容可复制");

      return;
    }

    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("已复制到剪贴板"))
      .catch(() => toast.error("复制失败"));
  };

  return (
    <ToolboxPageTemplate
      toolIcon="solar:text-selection-bold"
      toolIconColor="text-primary"
      toolName="JSON 字段命名转换"
    >
      <div className="flex flex-1 h-0 overflow-hidden gap-0">
        {/* 左侧输入编辑器 */}
        <Card className="flex-1 h-full overflow-hidden shadow-md border border-default-200 m-2 mr-0">
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
              <div className="flex items-center gap-1">
                <Tooltip content="格式化" placement="top">
                  <Button
                    isIconOnly
                    aria-label="格式化"
                    className="bg-default-100/50 hover:bg-default-200/60"
                    size="sm"
                    variant="light"
                    onPress={() => inputEditorRef.current?.format()}
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
                    aria-label="复制输入"
                    className="bg-default-100/50 hover:bg-default-200/60"
                    size="sm"
                    variant="light"
                    onPress={() => copyToClipboard(inputValue)}
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
            <div className="flex-1 w-full min-h-0 overflow-hidden">
              <MonacoEditor
                ref={inputEditorRef}
                height="100%"
                language="json"
                tabKey="keyNamingInput"
                theme={theme === "dark" ? "vs-dark" : "vs-light"}
                value={inputValue}
                onUpdateValue={(value) => setInputValue(value || "")}
              />
            </div>
          </CardBody>
        </Card>

        {/* 中间按钮列 */}
        <div className="flex flex-col items-center justify-center gap-3 min-w-28 px-2 py-2 overflow-y-auto">
          {FORMAT_OPTIONS.map(
            ({
              format,
              displayText,
              example,
              inactiveBg,
              inactiveBorder,
              inactiveHoverBg,
              inactiveHoverBorder,
              inactiveIconColor,
              activeBg,
              activeBorder,
              activeShadow,
            }) => {
              const isActive = activeFormat === format;

              return (
                <button
                  key={format}
                  className={`group w-full rounded-xl px-3 py-2.5 text-sm font-medium border
                  transition-all duration-200 ease-out
                  active:scale-[0.97]
                  ${
                    isActive
                      ? `${activeBg} ${activeBorder} text-white shadow-lg ${activeShadow} scale-[1.02]`
                      : `${inactiveBg} ${inactiveBorder} ${inactiveHoverBg} ${inactiveHoverBorder} text-default-700 dark:text-default-300 hover:shadow-md hover:scale-[1.02]`
                  }`}
                  type="button"
                  onClick={() => handleConvert(format)}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Icon
                      className={`transition-transform duration-200 group-hover:translate-x-0.5 ${
                        isActive ? "text-white/90" : inactiveIconColor
                      }`}
                      icon="solar:arrow-right-linear"
                      width={14}
                    />
                    {displayText}
                  </span>
                  <span
                    className={`block text-xs mt-0.5 font-mono transition-colors duration-200 ${
                      isActive ? "text-white/60" : "text-default-400"
                    }`}
                  >
                    {example}
                  </span>
                </button>
              );
            },
          )}
          <button
            className="group w-full rounded-xl px-3 py-2 text-sm font-medium
              bg-transparent border border-default-200 dark:border-default-700
              hover:bg-danger-50 dark:hover:bg-danger-950/30
              hover:border-danger-200 dark:hover:border-danger-800/40
              text-default-500 hover:text-danger
              transition-all duration-200 ease-out
              active:scale-[0.97] hover:scale-[1.02]"
            type="button"
            onClick={handleReset}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Icon
                className="transition-transform duration-200 group-hover:rotate-45 text-default-400 group-hover:text-danger"
                icon="solar:restart-linear"
                width={14}
              />
              重置
            </span>
          </button>
        </div>

        {/* 右侧输出编辑器 */}
        <Card className="flex-1 h-full overflow-hidden shadow-md border border-default-200 m-2 ml-0">
          <CardBody className="p-0 h-full flex flex-col">
            <div className="p-2.5 bg-default-50 border-b border-default-200 flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-2">
                <Icon
                  className="text-default-600"
                  icon="solar:code-square-linear"
                  width={16}
                />
                输出 JSON
              </span>
              <div className="flex items-center gap-1">
                <Tooltip content="格式化" placement="top">
                  <Button
                    isIconOnly
                    aria-label="格式化输出"
                    className="bg-default-100/50 hover:bg-default-200/60"
                    size="sm"
                    variant="light"
                    onPress={() => outputEditorRef.current?.format()}
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
                    aria-label="复制输出"
                    className="bg-default-100/50 hover:bg-default-200/60"
                    size="sm"
                    variant="light"
                    onPress={() => copyToClipboard(outputValue)}
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
            {collisions.length > 0 && (
              <div className="max-h-36 overflow-y-auto border-b border-danger-200 bg-danger-50 px-3 py-2 text-xs text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/30 dark:text-danger-300">
                <div className="mb-1 font-medium">
                  检测到 {collisions.length} 处字段命名冲突，未生成转换结果：
                </div>
                <ul className="space-y-1 font-mono">
                  {collisions.map(({ path, sourceKeys, targetKey }) => (
                    <li key={`${path}:${targetKey}`}>
                      {path}:{" "}
                      {sourceKeys.map((key) => JSON.stringify(key)).join("、")}
                      {" → "}
                      {JSON.stringify(targetKey)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex-1 w-full min-h-0 overflow-hidden">
              <MonacoEditor
                ref={outputEditorRef}
                height="100%"
                language="json"
                tabKey="keyNamingOutput"
                theme={theme === "dark" ? "vs-dark" : "vs-light"}
                value={outputValue}
                onUpdateValue={(value) => setOutputValue(value || "")}
              />
            </div>
          </CardBody>
        </Card>
      </div>
    </ToolboxPageTemplate>
  );
}
