import { useRef, useState, useEffect } from "react";
import { Button, Card, CardBody, Spinner, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import OpenAI from "openai";
import { jsonrepair } from "jsonrepair";

import toast from "@/utils/toast";
import MonacoDiffEditor, {
  MonacoDiffEditorRef,
} from "@/components/monacoEditor/monacoDiffEditor";
import MonacoDiffOperationBar, {
  MonacoDiffOperationBarRef,
} from "@/components/monacoEditor/MonacoDiffOperationBar";
import { MonacoDiffEditorEditorType } from "@/components/monacoEditor/monacoEntity.ts";
import { useOpenAIConfigStore } from "@/store/useOpenAIConfigStore";
import ToolboxPageTemplate from "@/layouts/toolboxPageTemplate";

export default function JsonAIRepairPage() {
  const { theme } = useTheme();

  const editorRef = useRef<MonacoDiffEditorRef>(null);
  const operationBarRef = useRef<MonacoDiffOperationBarRef>(null);

  // 使用 OpenAI 配置 store
  const openaiConfig = useOpenAIConfigStore();
  const { syncConfig } = useOpenAIConfigStore();

  // 编辑器内容状态
  const [originalValue, setOriginalValue] = useState<string>("");
  const [fixedValue, setFixedValue] = useState<string>("");

  // 处理状态
  const [isBasicProcessing, setIsBasicProcessing] = useState<boolean>(false);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>("");

  // 初始化时同步配置
  useEffect(() => {
    syncConfig();
  }, [syncConfig]);

  // 基本 JSON 修复函数
  const basicJsonFix = () => {
    setIsBasicProcessing(true);
    setProcessingStep("正在处理 JSON...");
    try {
      if (originalValue === "") {
        toast.warning("暂无内容");

        return false;
      }
      const repaired = jsonrepair(originalValue);

      editorRef.current?.updateModifiedValue(repaired);
      toast.success("修复成功");

      return true;
    } catch (e) {
      console.error("repairJson", e);
      toast.error("修复失败，可能不是有效的 Json 数据");

      return false;
    } finally {
      setIsBasicProcessing(false);
      setProcessingStep("");
    }
  };

  // 使用 OpenAI 库的 AI JSON 修复函数
  const aiJsonFix = async () => {
    if (!openaiConfig.apiKey) {
      toast.error("请在设置中输入您的 OpenAI API 密钥");

      return;
    }

    let originalValueLength = originalValue.length;

    if (originalValueLength === 0) {
      toast.warning("暂无内容");

      return;
    } else if (originalValueLength > 10000) {
      toast.warning("内容过长，请缩短后再尝试");

      return;
    }

    setIsAiProcessing(true);
    setIsStreaming(true);
    // 开始时清除已修复的值
    setFixedValue("");
    editorRef.current?.updateModifiedValue("");

    try {
      // 初始化 OpenAI 客户端
      setProcessingStep("Connecting to OpenAI...");
      const openai = new OpenAI({
        apiKey: openaiConfig.apiKey,
        baseURL:
          openaiConfig.useProxy && openaiConfig.proxyUrl
            ? openaiConfig.proxyUrl
            : undefined,
        dangerouslyAllowBrowser: true,
      });

      const promptText = `Fix the following invalid JSON and return ONLY the fixed JSON without any explanations or markdown:
\`\`\`json
${originalValue}
\`\`\``;

      setProcessingStep("AI 正在接收数据...");
      // 使用流式请求
      const stream = await openai.chat.completions.create({
        model: openaiConfig.model,
        messages: [{ role: "user", content: promptText }],
        temperature: openaiConfig.temperature,
        stream: true,
      });

      let accumulatedJson = "";

      setProcessingStep("AI 正在深度思考...");

      // 处理流
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";

        if (content) {
          accumulatedJson += content;

          // 始终实时更新编辑器，处理每个传入的块
          // 这会创建平滑的流式效果
          const cleanedJson = accumulatedJson
            .replace(/^```json\s*/i, "")
            .replace(/```\s*$/i, "")
            .trim();

          // 使用每个块立即更新编辑器
          editorRef.current?.updateModifiedValue(cleanedJson);
        }
      }

      // 处理最终结果
      try {
        // 如果存在 markdown 标记则清理
        let finalJson = accumulatedJson
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();

        // 如果是有效的 JSON 则格式化
        const parsedJson = JSON.parse(finalJson);
        const formattedJson = JSON.stringify(parsedJson, null, 2);

        editorRef.current?.updateModifiedValue(formattedJson);
      } catch (e) {
        // 如果无法解析最终结果，则保留清理后的版本
        const cleanedJson = accumulatedJson
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();

        editorRef.current?.updateModifiedValue(cleanedJson);
      }

      setProcessingStep("Repair Success");
    } catch (err) {
      toast.error("AI 修复错误: " + (err as Error).message);
      setProcessingStep("");
    } finally {
      setIsStreaming(false);
      setIsAiProcessing(false);
    }
  };

  // 重置函数
  const handleReset = () => {
    editorRef.current?.clear(MonacoDiffEditorEditorType.all);
    toast.success("内容已清空");
  };

  // 将修复后的 JSON 应用为新的原始内容
  const applyFixedContent = () => {
    if (fixedValue) {
      editorRef.current?.updateOriginalValue(fixedValue);
      editorRef.current?.updateModifiedValue("");
      toast.success("已应用修复后的内容");
    }
  };

  // 工具特定的操作按钮
  const actionButtons = (
    <>
      <Button
        color="secondary"
        isDisabled={isBasicProcessing || isAiProcessing}
        size="sm"
        startContent={
          isAiProcessing ? (
            <Spinner color="secondary" size="sm" />
          ) : (
            <Icon icon="solar:magic-stick-linear" width={18} />
          )
        }
        variant="bordered"
        onPress={aiJsonFix}
      >
        AI 修复
      </Button>
      <Button
        color="primary"
        isDisabled={isBasicProcessing || isAiProcessing}
        size="sm"
        startContent={
          isBasicProcessing ? (
            <Spinner color="primary" size="sm" />
          ) : (
            <Icon icon="mynaui:tool" width={18} />
          )
        }
        variant="bordered"
        onPress={basicJsonFix}
      >
        自动修复
      </Button>
      <Button
        color="success"
        isDisabled={!fixedValue || isBasicProcessing || isAiProcessing}
        size="sm"
        startContent={<Icon icon="solar:check-circle-outline" width={18} />}
        variant="bordered"
        onPress={applyFixedContent}
      >
        应用修复
      </Button>
      <Button
        color="danger"
        isDisabled={isBasicProcessing || isAiProcessing}
        size="sm"
        startContent={<Icon icon="solar:restart-outline" width={18} />}
        variant="bordered"
        onPress={handleReset}
      >
        重置
      </Button>
    </>
  );

  // 状态指示器
  const statusIndicator = processingStep ? (
    <Chip
      className="px-3"
      color={isBasicProcessing || isAiProcessing ? "warning" : "success"}
      startContent={
        isStreaming ? (
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
      toolIcon="solar:magic-stick-bold"
      toolIconColor="text-primary"
      toolName="JSON AI 修复工具"
    >
      <Card className="flex-1 overflow-hidden shadow-sm">
        <CardBody className="p-0 h-full flex flex-col">
          <MonacoDiffOperationBar
            ref={operationBarRef}
            onClear={(type) => editorRef.current?.clear(type) == true}
            onCopy={(type) => editorRef.current?.copy(type) == true}
            onFieldSort={(type, sort) =>
              editorRef.current?.fieldSort(type, sort) == true
            }
            onFormat={(type) => editorRef.current?.format(type) == true}
          />
          <div className="flex-1 min-h-0">
            <MonacoDiffEditor
              ref={editorRef}
              height="100%"
              modifiedValue={fixedValue}
              originalValue={originalValue}
              tabKey="json-fix-tool"
              theme={theme === "dark" ? "vs-dark" : "vs-light"}
              onUpdateModifiedValue={setFixedValue}
              onUpdateOriginalValue={setOriginalValue}
            />
          </div>
        </CardBody>
      </Card>
    </ToolboxPageTemplate>
  );
}
