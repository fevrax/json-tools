import {
  Button,
  Card,
  CardBody,
  Input,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Switch,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useEffect } from "react";

import toast from "@/utils/toast";
import { useSettingsStore, ChatStyle } from "@/store/useSettingsStore.ts";
import { storage } from "@/lib/indexedDBStore.ts";
import {
  useOpenAIConfigStore,
  AIRouteType,
} from "@/store/useOpenAIConfigStore.ts";
import { openAIService } from "@/services/openAIService.ts";

// 检查 utools 是否可用
const isUtoolsAvailable = typeof window !== "undefined" && "utools" in window;

export default function SettingsPage() {
  const {
    editDataSaveLocal,
    expandSidebar,
    chatStyle,
    // monacoEditorCDN,
    setEditDataSaveLocal,
    setExpandSidebar,
    setChatStyle,
    setMonacoEditorCDN,
  } = useSettingsStore();

  const {
    routeType,
    defaultRoute,
    utoolsRoute,
    customRoute,
    utoolsModels,
    updateConfig,
    updateDefaultRouteConfig,
    updateUtoolsRouteConfig,
    updateCustomRouteConfig,
    fetchUtoolsModels,
    syncConfig,
  } = useOpenAIConfigStore();

  const { theme, setTheme } = useTheme();

  // 初始化时同步配置
  useEffect(() => {
    // 从存储加载配置
    syncConfig();
  }, [syncConfig]);

  // 初始化时获取 Utools 模型列表
  useEffect(() => {
    if (routeType === "utools") {
      fetchUtoolsModels();
    }
  }, [routeType, fetchUtoolsModels]);

  // 当配置更改时，同步到 openAIService
  useEffect(() => {
    openAIService.syncConfig();
  }, [routeType]);

  // const editorLoadOptions = [
  //   { label: "本地嵌入", value: "local" },
  //   { label: "远程CDN", value: "cdn" },
  // ];

  const handleSettingChange = (key: string, value: any) => {
    switch (key) {
      case "editDataSaveLocal":
        setEditDataSaveLocal(value);
        if (!value) {
          removeStore();
        }
        break;
      case "expandSidebar":
        setExpandSidebar(value);
        break;
      case "chatStyle":
        setChatStyle(value);
        toast.success("聊天窗口样式已更改");
        break;
      case "monacoEditorCDN":
        setMonacoEditorCDN(value);
        toast.success("编辑器加载方式已更改，请重新加载或刷新后生效");
        reloadApp();
        break;
    }
  };

  // 更新 AI 线路类型
  const handleRouteTypeChange = (routeType: AIRouteType) => {
    updateConfig({ routeType });

    // 显示提示
    const routeMessages = {
      default: "已切换到默认线路，使用 json-tools 模型",
      utools: "已切换到 Utools 官方线路",
      custom: "已切换到私有线路，请确保填写正确的 API 信息",
    };

    toast.success(routeMessages[routeType]);

    // 如果切换到 utools 线路，尝试获取模型列表
    if (routeType === "utools") {
      if (!isUtoolsAvailable) {
        toast.error("uTools API 不可用，请确保在 uTools 环境中运行");
      } else {
        fetchUtoolsModels();
      }
    }

    // 同步到 openAIService
    openAIService.syncConfig();
  };

  // 更新默认线路配置
  const handleDefaultRouteConfigChange = (
    config: Partial<{
      model: string;
      temperature: number;
    }>,
  ) => {
    updateDefaultRouteConfig(config);
    toast.success("默认线路配置已更新");

    if (routeType === "default") {
      openAIService.syncConfig();
    }
  };

  // 更新 Utools 线路配置
  const handleUtoolsRouteConfigChange = (
    config: Partial<{
      model: string;
      temperature: number;
    }>,
  ) => {
    updateUtoolsRouteConfig(config);
    toast.success("Utools 线路配置已更新");

    if (routeType === "utools") {
      openAIService.syncConfig();
    }
  };

  // 更新自定义线路配置
  const handleCustomRouteConfigChange = (
    config: Partial<{
      apiKey: string;
      model: string;
      proxyUrl: string;
      temperature: number;
    }>,
  ) => {
    updateCustomRouteConfig(config);
    toast.success("自定义线路配置已更新");

    if (routeType === "custom") {
      openAIService.syncConfig();
    }
  };

  const removeStore = () => {
    storage.removeItem("sidebar");
    storage.removeItem("tabs");
    storage.removeItem("tabs_active_key");
    storage.removeItem("tabs_next_key");
    toast.success("本地存储已清除, 请重新加载或刷新页面");
  };

  const reloadApp = () => {
    // 重载应用的逻辑
    location.reload();
  };

  // 设置项配置
  const settingItems = [
    {
      id: "darkMode",
      title: "深色模式",
      description: "切换深色主题以保护眼睛",
      icon: "solar:moon-bold",
      isSelected: theme === "dark",
      onChange: (value: boolean) => setTheme(value ? "dark" : "light"),
    },
    {
      id: "localStorage",
      title: "本地存储",
      description: "将编辑器数据存储在本地，关闭后刷新页面数据将丢失",
      icon: "solar:database-bold",
      isSelected: editDataSaveLocal,
      onChange: (value: boolean) =>
        handleSettingChange("editDataSaveLocal", value),
    },
    {
      id: "expandTab",
      title: "展开Tab栏",
      description: "设置Tab栏是否默认展开",
      icon: "solar:square-top-down-bold",
      isSelected: expandSidebar,
      onChange: (value: boolean) => handleSettingChange("expandSidebar", value),
    },
  ];

  return (
    <div className="w-full h-full flex-1 p-6 bg-default-50">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-x-3 mb-2">
            <motion.h1
              animate={{ opacity: 1 }}
              className="text-3xl font-bold text-default-foreground"
              initial={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              设置
            </motion.h1>
            <motion.div
              animate={{ rotate: 360 }}
              initial={{ rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <Icon
                className="flex-none text-default-500"
                icon="solar:settings-bold"
                width={28}
              />
            </motion.div>
          </div>
          <p className="text-default-800 text-sm">
            自定义设置偏好，让你的编辑器更加舒适
          </p>
        </div>

        {/* 设置卡片 */}
        <Card
          fullWidth
          className="overflow-hidden backdrop bg-white/80 dark:bg-default-100/20"
          radius="lg"
          shadow="md"
        >
          <div className="px-6 py-5 border-b dark:border-gray-800">
            <h2 className="text-xl font-semibold text-default-900">常规设置</h2>
            <p className="text-sm text-default-500 mt-1">
              管理应用的基本设置和偏好
            </p>
          </div>

          <CardBody className="p-0">
            {/* 设置项列表 */}
            <div className="divide-y dark:divide-gray-800">
              {settingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-6 hover:bg-default-50/40 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-default/20 ">
                      <Icon icon={item.icon} width={22} />
                    </div>
                    <div>
                      <p className="text-default-900 font-medium">
                        {item.title}
                      </p>
                      <p className="text-sm text-default-500 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    className="ml-4"
                    color="primary"
                    isSelected={item.isSelected}
                    size="lg"
                    onValueChange={item.onChange}
                  />
                </div>
              ))}

              {/* AI 线路设置 */}
              <div className="p-6 hover:bg-default-50/40 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-full bg-default/20">
                    <Icon icon="solar:robot-bold" width={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-default-900 font-medium">AI 线路设置</p>
                    <p className="text-sm text-default-500 mt-1 mb-4">
                      选择您使用的 AI 服务线路和模型
                    </p>

                    <RadioGroup
                      className="mt-4"
                      color="primary"
                      value={routeType}
                      onValueChange={(value) =>
                        handleRouteTypeChange(value as AIRouteType)
                      }
                    >
                      {/* 默认线路 */}
                      <Radio
                        description="免费的gpt-4o-mini，上下文限制"
                        value="default"
                      >
                        默认线路
                      </Radio>

                      {routeType === "default" && (
                        <div className="ml-7 mt-2 mb-4 p-4 bg-default-100/50 rounded-lg">
                          <div className="mb-2 text-sm text-default-600">
                            默认模型:{" "}
                            <span className="font-medium">
                              {defaultRoute.model}
                            </span>
                          </div>
                          <div className="mb-2">
                            <label
                              className="block mb-2 text-sm font-medium"
                              htmlFor="default-temperature"
                            >
                              温度
                            </label>
                            <Input
                              className="w-full"
                              id="default-temperature"
                              max={1}
                              min={0}
                              placeholder="设置模型温度，范围 0-1"
                              step={0.1}
                              type="number"
                              value={defaultRoute.temperature.toString()}
                              variant="bordered"
                              onChange={(e) =>
                                handleDefaultRouteConfigChange({
                                  temperature: parseFloat(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div className="text-xs text-default-500">
                            默认线路使用免费的 gpt-4o-mini
                            模型，具有一定的上下文限制，但可以满足基本的 JSON
                            处理需求。
                            <br />
                          </div>
                        </div>
                      )}

                      {/* Utools 官方 */}
                      <Radio
                        description="连接UtoolsAl，由utools官方收费"
                        isDisabled={!isUtoolsAvailable}
                        value="utools"
                      >
                        Utools 官方
                      </Radio>

                      {routeType === "utools" && (
                        <div className="ml-7 mt-2 mb-4 p-4 bg-default-100/50 rounded-lg">
                          <div className="mb-3">
                            <label
                              className="block mb-2 text-sm font-medium"
                              htmlFor="utools-model"
                            >
                              选择模型
                            </label>
                            <Select
                              className="w-full"
                              id="utools-model"
                              placeholder="选择 Utools 模型"
                              selectedKeys={[utoolsRoute.model]}
                              size="sm"
                              variant="bordered"
                              onChange={(e) =>
                                handleUtoolsRouteConfigChange({
                                  model: e.target.value,
                                })
                              }
                            >
                              {utoolsModels.map((item) => (
                                <SelectItem key={item.value} >
                                  {item.label}
                                </SelectItem>
                              ))}
                            </Select>
                          </div>
                          <div className="mb-2">
                            <label
                              className="block mb-2 text-sm font-medium"
                              htmlFor="utools-temperature"
                            >
                              温度
                            </label>
                            <Input
                              className="w-full"
                              id="utools-temperature"
                              max={1}
                              min={0}
                              placeholder="设置模型温度，范围 0-1"
                              step={0.1}
                              type="number"
                              value={utoolsRoute.temperature.toString()}
                              variant="bordered"
                              onChange={(e) =>
                                handleUtoolsRouteConfigChange({
                                  temperature: parseFloat(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div className="text-xs text-default-500">
                            Utools 官方线路由 Utools
                            团队维护，提供更稳定的服务和更多模型选择，但需要付费使用。
                          </div>
                        </div>
                      )}

                      {/* 私有线路 */}
                      <Radio description="自定义 API 地址和密钥" value="custom">
                        私有线路
                      </Radio>

                      {routeType === "custom" && (
                        <div className="ml-7 mt-2 mb-4 p-4 bg-default-100/50 rounded-lg">
                          <div className="mb-3">
                            <label
                              className="block mb-2 text-sm font-medium"
                              htmlFor="api-url"
                            >
                              API 地址
                            </label>
                            <Input
                              className="w-full"
                              id="api-url"
                              placeholder="输入 API 地址，例如: https://api.openai.com/v1"
                              size="sm"
                              value={customRoute.proxyUrl}
                              variant="bordered"
                              onChange={(e) =>
                                handleCustomRouteConfigChange({
                                  proxyUrl: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="mb-3">
                            <label
                              className="block mb-2 text-sm font-medium"
                              htmlFor="api-key"
                            >
                              API 密钥
                            </label>
                            <Input
                              className="w-full"
                              id="api-key"
                              placeholder="输入您的 API 密钥"
                              size="sm"
                              type="password"
                              value={customRoute.apiKey}
                              variant="bordered"
                              onChange={(e) =>
                                handleCustomRouteConfigChange({
                                  apiKey: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="mb-3">
                            <label
                              className="block mb-2 text-sm font-medium"
                              htmlFor="model-name"
                            >
                              模型名称
                            </label>
                            <Input
                              className="w-full"
                              id="model-name"
                              placeholder="输入模型名称，例如: gpt-4-turbo"
                              size="sm"
                              value={customRoute.model}
                              variant="bordered"
                              onChange={(e) =>
                                handleCustomRouteConfigChange({
                                  model: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="mb-3">
                            <label
                              className="block mb-2 text-sm font-medium"
                              htmlFor="custom-temperature"
                            >
                              温度
                            </label>
                            <Input
                              className="w-full"
                              id="custom-temperature"
                              max={1}
                              min={0}
                              placeholder="设置模型温度，范围 0-1"
                              step={0.1}
                              type="number"
                              value={customRoute.temperature.toString()}
                              variant="bordered"
                              onChange={(e) =>
                                handleCustomRouteConfigChange({
                                  temperature: parseFloat(e.target.value),
                                })
                              }
                            />
                          </div>

                          <div className="text-xs text-default-500">
                            私有线路允许您使用自己的 API 密钥和自定义端点，支持
                            OpenAI 兼容的任何服务。
                          </div>
                        </div>
                      )}
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* 聊天窗口样式设置 */}
              <div className="p-6 hover:bg-default-50/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-full bg-default/20">
                      <Icon icon="solar:chat-round-dots-bold" width={22} />
                    </div>
                    <div>
                      <p className="text-default-900 font-medium">
                        聊天窗口样式
                      </p>
                      <p className="text-sm text-default-500 mt-1">
                        选择您喜欢的聊天界面显示风格
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div
                      aria-label="选择对话模式聊天样式"
                      className={`flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 ${
                        chatStyle === "bubble"
                          ? "scale-105 opacity-100"
                          : "opacity-70 hover:opacity-90"
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        handleSettingChange("chatStyle", "bubble" as ChatStyle)
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        handleSettingChange("chatStyle", "bubble" as ChatStyle)
                      }
                    >
                      <div
                        className={`border p-2 rounded-lg w-24 h-20 flex items-center justify-center transition-colors duration-200 ${
                          chatStyle === "bubble"
                            ? "border-primary/50 bg-primary/5 shadow-sm"
                            : "border-default-200 dark:border-default-700"
                        }`}
                      >
                        <div className="flex flex-col gap-2 w-full">
                          <div className="w-full h-4 rounded-full bg-primary/20" />
                          <div className="w-3/4 h-4 ml-auto rounded-full bg-default-200" />
                        </div>
                      </div>
                      <p
                        className={`text-xs font-medium ${chatStyle === "bubble" ? "text-primary" : "text-default-600"}`}
                      >
                        气泡模式
                      </p>
                    </div>
                    <div
                      aria-label="选择文档模式聊天样式"
                      className={`flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 ${
                        chatStyle === "document"
                          ? "scale-105 opacity-100"
                          : "opacity-70 hover:opacity-90"
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        handleSettingChange(
                          "chatStyle",
                          "document" as ChatStyle,
                        )
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        handleSettingChange(
                          "chatStyle",
                          "document" as ChatStyle,
                        )
                      }
                    >
                      <div
                        className={`border p-2 rounded-lg w-24 h-20 flex items-center justify-center transition-colors duration-200 ${
                          chatStyle === "document"
                            ? "border-primary/50 bg-primary/5 shadow-sm"
                            : "border-default-200 dark:border-default-700"
                        }`}
                      >
                        <div className="flex flex-col gap-2 w-full">
                          <div className="w-full h-3 rounded-sm bg-primary/20" />
                          <div className="w-full h-3 rounded-sm bg-default-200" />
                          <div className="w-3/4 h-3 rounded-sm bg-primary/20" />
                        </div>
                      </div>
                      <p
                        className={`text-xs font-medium ${chatStyle === "document" ? "text-primary" : "text-default-600"}`}
                      >
                        文档模式
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 重置应用 */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-danger/10 text-danger">
                      <Icon icon="solar:restart-bold" width={22} />
                    </div>
                    <div>
                      <p className="text-default-900 font-medium">重置应用</p>
                      <p className="text-sm text-default-500 mt-1">
                        重置应用，清除本地存储，刷新页面后将重新加载应用
                      </p>
                    </div>
                  </div>
                  <Tooltip content="此操作将清除所有本地数据">
                    <Button
                      color="danger"
                      radius="full"
                      startContent={<Icon icon="solar:refresh-bold" />}
                      variant="flat"
                      onPress={() => {
                        removeStore();
                      }}
                    >
                      重置应用
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 版本信息 */}
        <div className="mt-6 text-center text-sm text-default-400">
          <p>JSON Tools Next © {new Date().getFullYear()}</p>
          <p className="mt-1">Version 1.0.0</p>
        </div>
      </motion.div>
    </div>
  );
}
