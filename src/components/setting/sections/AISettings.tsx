import type { TestResult } from "../ai/TestConnection";

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

import {
  GroupLabel,
  InfoNote,
  SectionCard,
  SectionHeader,
} from "../settingPrimitives";
import { RouteCard } from "../ai/RouteCard";
import { RouteConfigPanel } from "../ai/RouteConfigPanel";

import toast from "@/utils/toast";
import ExternalLink from "@/components/ExternalLink";
import {
  useOpenAIConfigStore,
  type AIRouteType,
} from "@/store/useOpenAIConfigStore";
import { OpenAIService, openAIService } from "@/services/openAIService";
import { isUtoolsAvailable } from "@/utils/env";

/**
 * AI 助手设置：线路管理（4 条线路） + 线路配置面板 + 推荐横幅 + 添加模型弹窗。
 * 行为与原 settingPage.renderAISettings 一致，仅做组件拆分与样式收敛。
 */
export function AISettings() {
  const {
    routeType,
    ssooaiRoute,
    customRoute,
    ssooaiModels,
    customModels,
    utoolsModels,
    routeEnabled,
    updateConfig,
    updateUtoolsRouteConfig,
    updateSsooaiRouteConfig,
    updateCustomRouteConfig,
    updateRouteEnabled,
    fetchUtoolsModels,
    fetchSsooaiModels,
    fetchCustomModels,
    syncConfig,
    addCustomModel,
    removeCustomModel,
    addSsooaiModel,
    removeSsooaiModel,
  } = useOpenAIConfigStore();

  const [configuringRoute, setConfiguringRoute] = useState<AIRouteType | null>(
    null,
  );
  const [testingRoute, setTestingRoute] = useState<AIRouteType | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [newModelName, setNewModelName] = useState("");
  const [newModelLabel, setNewModelLabel] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [addModelMode, setAddModelMode] = useState<"ssooai" | "custom">(
    "custom",
  );

  const [testModelUtools, setTestModelUtools] = useState<string>("");
  const [testModelSsooai, setTestModelSsooai] =
    useState<string>("deepseek-v4-pro");
  const [testModelCustom, setTestModelCustom] =
    useState<string>("deepseek-v4-pro");

  // 初始化时同步配置
  useEffect(() => {
    syncConfig();
  }, [syncConfig]);

  // 按当前线路获取模型列表
  useEffect(() => {
    if (routeType === "utools") {
      fetchUtoolsModels();
    } else if (routeType === "ssooai" && ssooaiRoute.apiKey) {
      fetchSsooaiModels();
    } else if (
      routeType === "custom" &&
      customRoute.apiKey &&
      customRoute.proxyUrl
    ) {
      useOpenAIConfigStore.getState().fetchCustomModels();
    }
  }, [
    routeType,
    fetchUtoolsModels,
    fetchSsooaiModels,
    ssooaiRoute.apiKey,
    customRoute.apiKey,
    customRoute.proxyUrl,
  ]);

  // 配置变更同步到 openAIService
  useEffect(() => {
    openAIService.syncConfig();
  }, [routeType]);

  // 默认测试模型
  useEffect(() => {
    if (utoolsModels.length > 0 && !testModelUtools) {
      setTestModelUtools(utoolsModels[0].value);
    }
  }, [utoolsModels, testModelUtools]);

  useEffect(() => {
    if (ssooaiModels.length > 0 && !testModelSsooai) {
      setTestModelSsooai(ssooaiModels[0].value);
    }
  }, [ssooaiModels, testModelSsooai]);

  useEffect(() => {
    if (customModels.length > 0 && !testModelCustom) {
      setTestModelCustom(customModels[0].value);
    }
  }, [customModels, testModelCustom]);

  // 配置线路：切换 routeType 并自动启用
  const handleConfigureRoute = (type: AIRouteType) => {
    setConfiguringRoute(type);
    updateConfig({ routeType: type });
    if (type !== "default") {
      updateRouteEnabled(type, true);
    }
    setTestingRoute(null);
    setTestResult(null);
    if (type === "utools") {
      if (!isUtoolsAvailable) {
        toast.error("uTools API 不可用，请确保在 uTools 环境中运行");
      } else {
        fetchUtoolsModels();
      }
    }
    openAIService.syncConfig();
  };

  const handleCloseConfig = () => setConfiguringRoute(null);

  // 配置变更处理
  const handleApiKeyChange = (route: "ssooai" | "custom", apiKey: string) => {
    if (route === "ssooai") {
      updateSsooaiRouteConfig({ apiKey });
      if (apiKey && routeType === "ssooai") fetchSsooaiModels();
      if (routeType === "ssooai") openAIService.syncConfig();
    } else {
      updateCustomRouteConfig({ apiKey });
      if (routeType === "custom") openAIService.syncConfig();
    }
  };

  const handleProxyUrlChange = (proxyUrl: string) => {
    updateCustomRouteConfig({ proxyUrl });
    if (routeType === "custom") openAIService.syncConfig();
  };

  const handleUtoolsModelChange = (model: string) => {
    updateUtoolsRouteConfig({ model });
    if (routeType === "utools") openAIService.syncConfig();
  };

  // 测试连接
  const testRouteConnection = async (type: AIRouteType, testModel?: string) => {
    setTestingRoute(type);
    setTestResult(null);
    const testService = OpenAIService.createInstance();

    try {
      let modelToTest: string;

      if (type === "default") {
        modelToTest = useOpenAIConfigStore.getState().defaultRoute.model;
      } else if (testModel) {
        modelToTest = testModel;
      } else {
        throw new Error("请选择要测试的模型");
      }

      testService.updateConfig({ routeType: type, model: modelToTest });
      const response = await testService.chat({
        messages: [{ role: "user", content: "say 1" }],
        model: modelToTest,
      });

      if (response?.choices?.[0]?.message) {
        setTestResult({ success: true, message: "连接成功，线路畅通！" });
      } else {
        throw new Error("API 返回结果异常");
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "未知错误，连接失败",
      });
    } finally {
      setTestingRoute(null);
    }
  };

  // 添加 / 删除模型
  const openAddModel = (mode: "ssooai" | "custom") => {
    setAddModelMode(mode);
    setNewModelName("");
    setNewModelLabel("");
    onOpen();
  };

  const handleAddModel = () => {
    if (!newModelName.trim()) {
      toast.error("请输入模型名称");

      return;
    }
    if (addModelMode === "custom") {
      addCustomModel(newModelName, newModelLabel || undefined);
      updateCustomRouteConfig({ model: customRoute.model });
    } else {
      addSsooaiModel(newModelName, newModelLabel || undefined);
      updateSsooaiRouteConfig({ model: ssooaiRoute.model });
    }
    setNewModelName("");
    setNewModelLabel("");
    onClose();
    toast.success(`已添加模型 ${newModelName}`);
  };

  const handleRemoveCustomModel = (modelValue: string) => {
    const isCurrent = modelValue === customRoute.model;

    removeCustomModel(modelValue);
    if (isCurrent && customModels.length > 1) {
      const next = customModels.find((m) => m.value !== modelValue);

      updateCustomRouteConfig({ model: next ? next.value : "" });
    } else {
      updateCustomRouteConfig({ model: customRoute.model });
    }
    toast.success(`已删除模型 ${modelValue}`);
  };

  const handleRemoveSsooaiModel = (modelValue: string) => {
    const isCurrent = modelValue === ssooaiRoute.model;

    removeSsooaiModel(modelValue);
    if (isCurrent && ssooaiModels.length > 1) {
      const next = ssooaiModels.find((m) => m.value !== modelValue);

      updateSsooaiRouteConfig({ model: next ? next.value : "" });
    } else {
      updateSsooaiRouteConfig({ model: ssooaiRoute.model });
    }
    toast.success(`已删除模型 ${modelValue}`);
  };

  return (
    <div className="h-full">
      <SectionHeader description="管理 AI 线路与模型配置" title="AI 设置" />

      <GroupLabel>AI 线路</GroupLabel>
      <p className="mb-3 px-4 text-[13px] text-default-500">
        启用或禁用不同的 AI
        线路，点击「配置」按钮设置线路参数。站点线路需要由站点管理员启用。
      </p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <RouteCard
          isSelected
          showConfigure
          description="使用站点提供的 AI 服务；不可用时可配置私有线路"
          routeType="default"
          onConfigure={() => handleConfigureRoute("default")}
          onToggle={() => {}}
        />
        <RouteCard
          available
          showConfigure
          description="高性能服务，支持多种高级模型"
          isSelected={routeEnabled.ssooai}
          routeType="ssooai"
          onConfigure={() => handleConfigureRoute("ssooai")}
          onToggle={(enabled) => updateRouteEnabled("ssooai", enabled)}
        />
        <RouteCard
          available={isUtoolsAvailable}
          description="uTools 官方的 AI 智能助手"
          isSelected={routeEnabled.utools}
          routeType="utools"
          onToggle={(enabled) => updateRouteEnabled("utools", enabled)}
        />
        <RouteCard
          available
          showConfigure
          description="自定义 API 连接，支持各类模型"
          isSelected={routeEnabled.custom}
          routeType="custom"
          onConfigure={() => handleConfigureRoute("custom")}
          onToggle={(enabled) => updateRouteEnabled("custom", enabled)}
        />
      </div>

      {/* 推荐横幅 */}
      <InfoNote className="mx-0 mt-5 sm:mx-0" title="推荐使用 SSOOAI API">
        <p>
          <ExternalLink
            className="font-medium text-primary hover:underline"
            href="https://api.ssooai.com"
          >
            SSOOAI
          </ExternalLink>{" "}
          提供稳定、高效且价格实惠的 API 服务，支持 ChatGPT、DeepSeek、Claude 4
          等先进模型。新用户可享受充值优惠。
        </p>
      </InfoNote>

      {/* 线路配置面板 */}
      {configuringRoute ? <GroupLabel>线路配置</GroupLabel> : null}
      {configuringRoute ? (
        <SectionCard className="p-4 sm:p-5">
          <RouteConfigPanel
            isUtoolsAvailable={isUtoolsAvailable}
            routeType={configuringRoute}
            testModelCustom={testModelCustom}
            testModelSsooai={testModelSsooai}
            testModelUtools={testModelUtools}
            testResult={testResult}
            testing={testingRoute === configuringRoute}
            onAddModel={openAddModel}
            onClose={handleCloseConfig}
            onConfigureApiKey={handleApiKeyChange}
            onConfigureProxyUrl={handleProxyUrlChange}
            onConfigureUtoolsModel={handleUtoolsModelChange}
            onRefreshCustomModels={fetchCustomModels}
            onRefreshSsooaiModels={fetchSsooaiModels}
            onRemoveCustomModel={handleRemoveCustomModel}
            onRemoveSsooaiModel={handleRemoveSsooaiModel}
            onSetTestModel={(route, value) => {
              if (route === "utools") setTestModelUtools(value);
              else if (route === "ssooai") setTestModelSsooai(value);
              else setTestModelCustom(value);
            }}
            onTest={testRouteConnection}
          />
        </SectionCard>
      ) : null}

      {/* 添加模型弹窗 */}
      <Modal backdrop="blur" isOpen={isOpen} onClose={onClose}>
        <ModalContent className="p-1">
          <ModalHeader className="flex items-center gap-2 pb-2">
            <div className="rounded-lg bg-primary/15 p-1.5">
              <Icon
                className="text-primary"
                icon="solar:add-circle-bold"
                width={18}
              />
            </div>
            添加{addModelMode === "ssooai" ? "SSOOAI" : "自定义"}模型
          </ModalHeader>
          <ModalBody>
            <div className="mb-4">
              <label
                className="mb-2 flex items-center gap-2 text-sm font-medium"
                htmlFor="new-model-name"
              >
                <Icon
                  className="text-primary"
                  icon="solar:code-bold"
                  width={16}
                />
                模型名称 <span className="text-danger">*</span>
              </label>
              <Input
                className="w-full"
                id="new-model-name"
                placeholder="输入模型名称，例如: gpt-4-0613"
                value={newModelName}
                variant="bordered"
                onChange={(e) => setNewModelName(e.target.value)}
              />
              <p className="ml-5 mt-1 text-xs text-default-500">
                该名称用于API请求，必须准确填写
              </p>
            </div>
            <div>
              <label
                className="mb-2 flex items-center gap-2 text-sm font-medium"
                htmlFor="new-model-label"
              >
                <Icon
                  className="text-primary"
                  icon="solar:text-bold"
                  width={16}
                />
                显示名称
              </label>
              <Input
                className="w-full"
                id="new-model-label"
                placeholder="输入显示名称，例如: GPT-4 (8K)"
                value={newModelLabel}
                variant="bordered"
                onChange={(e) => setNewModelLabel(e.target.value)}
              />
              <p className="ml-5 mt-1 text-xs text-default-500">
                显示在界面上的友好名称，可选
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              radius="full"
              variant="flat"
              onPress={onClose}
            >
              取消
            </Button>
            <Button
              color="primary"
              isDisabled={!newModelName.trim()}
              radius="full"
              startContent={<Icon icon="solar:add-circle-bold" width={18} />}
              onPress={handleAddModel}
            >
              添加模型
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
