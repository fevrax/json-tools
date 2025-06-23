import {
  Button,
  Input,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Switch,
  Tooltip,
  Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

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
  const [activeTab, setActiveTab] = useState("general");

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
    // 清除所有本地存储
    storage.clear();
    
    // 重置 Zustand stores 到默认状态
    useSettingsStore.setState({
      editDataSaveLocal: false,
      expandSidebar: false,
      monacoEditorCDN: "local",
      chatStyle: "bubble"
    });
    
    // 重置 OpenAI 配置
    useOpenAIConfigStore.getState().resetConfig();
    
    toast.success("所有设置已重置，请重新加载或刷新页面");
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

  // 侧边栏菜单项
  const menuItems = [
    { key: "general", label: "通用设置", icon: "solar:settings-bold" },
    { key: "appearance", label: "外观设置", icon: "catppuccin:folder-themes" },
    { key: "ai", label: "AI 助手", icon: "hugeicons:ai-chat-02" },
    { key: "about", label: "关于", icon: "solar:info-circle-bold" },
  ];

  // 渲染侧边栏菜单
  const renderSidebar = () => (
    <div className="w-52 sm:w-56 md:w-64 h-full bg-default-50 dark:bg-default-100/50 border-r border-default-200 shadow-sm flex-shrink-0">
      <div className="p-4 md:p-5">
        <h2 className="text-lg md:text-xl font-bold text-default-900 flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon
              className="text-primary"
              icon="solar:settings-bold"
              width={22}
            />
          </div>
          <span>设置</span>
        </h2>
        <p className="text-xs md:text-sm text-default-500 mt-1 ml-1">
          自定义您的应用体验
        </p>
      </div>
      <Divider className="my-1" />
      <div className="p-2">
        {menuItems.map((item) => (
          <button
            key={item.key}
            className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 my-1 rounded-lg cursor-pointer transition-all text-left ${
              activeTab === item.key
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-default-100/70 text-default-700"
            }`}
            onClick={() => setActiveTab(item.key)}
          >
            <Icon className="flex-shrink-0" icon={item.icon} width={18} />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // 渲染通用设置内容
  const renderGeneralSettings = () => (
    <div className="h-full">
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-default-900 flex items-center gap-2">
          <Icon className="text-primary" icon="solar:settings-bold" />
          通用设置
        </h2>
        <p className="text-sm md:text-base text-default-500 mt-1">
          管理应用的基本设置和偏好
        </p>
      </div>

      <div className="bg-background/60 backdrop-blur-sm rounded-xl overflow-hidden border border-default-200">
        <div className="divide-y divide-default-200">
          {settingItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-5 hover:bg-default-100/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <Icon icon={item.icon} width={22} />
                </div>
                <div>
                  <p className="text-default-900 font-medium">{item.title}</p>
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

          {/* 重置应用 */}
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-danger/10 text-danger">
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
      </div>
    </div>
  );

  // 渲染 AI 设置内容
  const renderAISettings = () => (
    <div className="h-full">
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-default-900 flex items-center gap-2">
          <Icon className="text-primary" icon="solar:robot-bold" />
          AI 设置
        </h2>
        <p className="text-sm md:text-base text-default-500 mt-1">
          配置 AI 服务和模型选项
        </p>
      </div>

      <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="text-primary" icon="solar:star-bold" />
          <span className="font-medium">推荐使用 SSOOAI API</span>
        </div>
        <p className="text-sm">
          <a
            className="text-primary hover:underline"
            href="https://api.ssooai.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            SSOOAI
          </a>{" "}
          提供稳定、高效且价格实惠的 API 服务，支持多种先进模型，包括
          ChatGPT、DeepSeek、Claude 4 等。 访问{" "}
          <a
            className="text-primary hover:underline"
            href="https://api.ssooai.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            https://api.ssooai.com
          </a>{" "}
          获取 API 密钥，
          体验更快的响应速度和更高的稳定性。新用户可享受充值优惠！
        </p>
      </div>

      <RadioGroup
        className="space-y-4"
        color="primary"
        value={routeType}
        onValueChange={(value) => handleRouteTypeChange(value as AIRouteType)}
      >
        {/* 默认线路 */}
        <div className="p-5 rounded-xl bg-background/60 backdrop-blur-sm border border-default-200 hover:bg-default-100/30 transition-colors">
          <Radio
            description="由 SSOOAI 免费提供的GPT 4.1模型，上下文限制"
            value="default"
          >
            <span className="text-lg font-medium">默认线路</span>
            <span className="ml-2 text-xs px-2 py-0.5 bg-success/20 text-success rounded-full">
              免费
            </span>
          </Radio>

          {routeType === "default" && (
            <div className="ml-7 mt-4 p-4 bg-default-100/50 rounded-xl">
              <div className="mb-2 text-sm text-default-600">
                默认模型: <span className="font-medium">GPT 4.1</span>{" "}
                <span className="text-xs text-primary">
                  (由{" "}
                  <a
                    className="text-primary hover:underline"
                    href="https://api.ssooai.com"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    SSOOAI
                  </a>{" "}
                  提供)
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
                默认线路使用免费的 gpt-4.1
                模型，具有一定的上下文限制，但可以满足基本的 JSON 处理需求。
              </div>
            </div>
          )}
        </div>

        {/* Utools 官方 */}
        <div className="p-5 rounded-xl bg-background/60 backdrop-blur-sm border border-default-200 hover:bg-default-100/30 transition-colors">
          <Radio
            description="连接 uToolsAI，由 uTools 官方AI能量结算"
            isDisabled={!isUtoolsAvailable}
            value="utools"
          >
            <span className="text-lg font-medium">uTools 官方</span>
            <span className="ml-2 text-xs px-2 py-0.5 bg-warning/20 text-warning rounded-full">
              uTools AI能量
            </span>
          </Radio>

          {routeType === "utools" && (
            <div className="ml-7 mt-4 p-4 bg-default-100/50 rounded-xl">
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
                  placeholder="选择 uTools 模型"
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
                    <SelectItem key={item.value}>{item.label}</SelectItem>
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
        </div>

        {/* 私有线路 */}
        <div className="p-5 rounded-xl bg-background/60 backdrop-blur-sm border border-default-200 hover:bg-default-100/30 transition-colors">
          <Radio description="自定义 API 地址和密钥" value="custom">
            <span className="text-lg font-medium">私有线路</span>
            <span className="ml-2 text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
              私有
            </span>
          </Radio>

          {routeType === "custom" && (
            <div className="ml-7 mt-4 p-4 bg-default-100/50 rounded-xl">
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
                  placeholder="输入 API 地址，例如: https://api.ssooai.com/v1"
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
                私有线路允许您使用自己的 API 密钥和自定义端点，支持 OpenAI
                兼容的任何服务。
              </div>

              <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Icon
                    className="text-primary"
                    icon="solar:bookmark-square-bold"
                  />
                  <span className="font-medium text-sm">SSOOAI API 推荐</span>
                </div>
                <p className="text-xs mt-1">
                  推荐使用 SSOOAI API 作为私有线路，填入 API 地址：
                  <code className="bg-default-100 px-1 py-0.5 rounded">
                    https://api.ssooai.com/v1
                  </code>
                  ， 注册即可获得免费额度。高稳定性、低延迟、更实惠的价格！
                </p>
              </div>
            </div>
          )}
        </div>
      </RadioGroup>
    </div>
  );

  // 渲染外观设置内容
  const renderAppearanceSettings = () => (
    <div className="h-full">
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-default-900 flex items-center gap-2">
          <Icon className="text-primary" icon="solar:brush-bold" />
          外观设置
        </h2>
        <p className="text-sm md:text-base text-default-500 mt-1">
          自定义应用的外观和显示方式
        </p>
      </div>

      {/* 聊天窗口样式设置 */}
      <div className="p-5 rounded-xl bg-background/60 backdrop-blur-sm border border-default-200">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Icon
              className="text-primary"
              icon="solar:chat-round-dots-bold"
              width={20}
            />
            <h3 className="text-lg font-medium text-default-900">
              聊天窗口样式
            </h3>
          </div>
          <p className="text-sm text-default-500 mt-1 ml-7">
            选择您喜欢的聊天界面显示风格
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-4 md:mt-5 ml-4 md:ml-7">
          <div
            aria-label="选择对话模式聊天样式"
            className={`flex flex-col items-center gap-2 sm:gap-3 cursor-pointer transition-all duration-200 ${
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
              className={`border p-2 sm:p-3 rounded-lg w-28 sm:w-36 h-24 sm:h-28 flex items-center justify-center transition-colors duration-200 ${
                chatStyle === "bubble"
                  ? "border-primary/50 bg-primary/5 shadow-sm"
                  : "border-default-200 border-default-200"
              }`}
            >
              <div className="flex flex-col gap-2 w-full">
                <div className="w-full h-4 rounded-full bg-primary/20" />
                <div className="w-3/4 h-4 ml-auto rounded-full bg-default-200" />
                <div className="w-full h-4 rounded-full bg-primary/20" />
              </div>
            </div>
            <p
              className={`text-sm font-medium ${
                chatStyle === "bubble" ? "text-primary" : "text-default-600"
              }`}
            >
              气泡模式
            </p>
          </div>

          <div
            aria-label="选择文档模式聊天样式"
            className={`flex flex-col items-center gap-2 sm:gap-3 cursor-pointer transition-all duration-200 ${
              chatStyle === "document"
                ? "scale-105 opacity-100"
                : "opacity-70 hover:opacity-90"
            }`}
            role="button"
            tabIndex={0}
            onClick={() =>
              handleSettingChange("chatStyle", "document" as ChatStyle)
            }
            onKeyDown={(e) =>
              e.key === "Enter" &&
              handleSettingChange("chatStyle", "document" as ChatStyle)
            }
          >
            <div
              className={`border p-2 sm:p-3 rounded-lg w-28 sm:w-36 h-24 sm:h-28 flex items-center justify-center transition-colors duration-200 ${
                chatStyle === "document"
                  ? "border-primary/50 bg-primary/5 shadow-sm"
                  : "border-default-200 border-default-200"
              }`}
            >
              <div className="flex flex-col gap-2 w-full">
                <div className="w-full h-3 rounded-sm bg-primary/20" />
                <div className="w-full h-3 rounded-sm bg-default-200" />
                <div className="w-3/4 h-3 rounded-sm bg-primary/20" />
                <div className="w-full h-3 rounded-sm bg-default-200" />
              </div>
            </div>
            <p
              className={`text-sm font-medium ${
                chatStyle === "document" ? "text-primary" : "text-default-600"
              }`}
            >
              文档模式
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染关于内容
  const renderAboutContent = () => (
    <div className="h-full">
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-default-900 flex items-center gap-2">
          <Icon className="text-primary" icon="solar:info-circle-bold" />
          关于 JSON Tools
        </h2>
        <p className="text-sm md:text-base text-default-500 mt-1">
          了解更多关于应用的信息
        </p>
      </div>

      <div className="rounded-xl bg-background/60 backdrop-blur-sm border border-default-200 overflow-hidden">
        <div className="flex flex-col items-center text-center p-8 bg-gradient-to-b from-primary/5 to-background">
          <img
            alt="JSON Tools Logo"
            className="w-24 h-24 mb-4 drop-shadow-md"
            src="./logo.png"
          />
          <h3 className="text-2xl font-bold text-default-900">JSON Tools</h3>
          <p className="text-default-600 mt-2">强大的 JSON 处理工具集</p>
          {/*<div className="bg-default-100 px-3 py-1 rounded-full text-sm mt-3 shadow-sm">*/}
          {/*  版本 1.0.0*/}
          {/*</div>*/}
        </div>

        <Divider />

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-default-900 mb-4 flex items-center gap-2">
                <Icon className="text-primary" icon="solar:star-bold" />
                功能
              </h4>
              <ul className="space-y-3 text-default-700">
                <li className="flex items-center gap-2">
                  <Icon
                    className="text-success"
                    icon="solar:check-circle-bold"
                  />
                  JSON 格式化与验证
                </li>
                <li className="flex items-center gap-2">
                  <Icon
                    className="text-success"
                    icon="solar:check-circle-bold"
                  />
                  智能 AI 辅助修复
                </li>
                <li className="flex items-center gap-2">
                  <Icon
                    className="text-success"
                    icon="solar:check-circle-bold"
                  />
                  数据格式转换
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-medium text-default-900 mb-4 flex items-center gap-2">
                <Icon
                  className="text-primary"
                  icon="solar:headphones-round-bold"
                />
                技术支持
              </h4>
              <div className="space-y-3">
                <a
                  className="flex items-center gap-2 text-primary hover:underline"
                  href="https://github.com/fevrax/json-tools"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Icon icon="mdi:github" />
                  GitHub 仓库
                </a>
                <a
                  className="flex items-center gap-2 text-primary hover:underline"
                  href="https://github.com/fevrax/json-tools/issues"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Icon icon="solar:chat-square-code-bold" />
                  问题反馈
                </a>
                <a
                  className="flex items-center gap-2 text-primary hover:underline"
                  href="https://yourdocs.com"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Icon icon="solar:document-bold" />
                  使用文档
                </a>
              </div>
            </div>
          </div>
        </div>

        <Divider />

        <div className="text-center p-5 text-sm text-default-500 bg-default-50/50">
          <p>© {new Date().getFullYear()} JSON Tools. 保留所有权利。</p>
          <p className="mt-1">基于 React、TypeScript 和 HeroUI 构建</p>
        </div>
      </div>
    </div>
  );

  // 根据当前活动标签渲染内容
  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralSettings();
      case "ai":
        return renderAISettings();
      case "appearance":
        return renderAppearanceSettings();
      case "about":
        return renderAboutContent();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="w-full h-full flex-1 bg-default-50 dark:bg-default-50/5">
      <div className="flex flex-row h-full overflow-hidden">
        {/* 侧边栏 */}
        {renderSidebar()}

        {/* 主内容区域 */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
          <motion.div
            key={activeTab}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mx-auto pb-6 md:pb-8"
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
