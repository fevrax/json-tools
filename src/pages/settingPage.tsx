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
  Tabs,
  Tab,
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

  // 侧边栏菜单项
  const menuItems = [
    { key: "general", label: "通用设置", icon: "solar:settings-bold" },
    { key: "ai", label: "AI 设置", icon: "solar:robot-bold" },
    { key: "appearance", label: "外观", icon: "solar:brush-bold" },
    { key: "about", label: "关于", icon: "solar:info-circle-bold" },
  ];

  // 渲染侧边栏菜单
  const renderSidebar = () => (
    <div className="w-64 h-full bg-default-50 dark:bg-default-100/20 border-r dark:border-default-700">
      <div className="p-4">
        <h2 className="text-xl font-bold text-default-900 flex items-center gap-2">
          <Icon icon="solar:settings-bold" width={24} className="text-primary" />
          设置
        </h2>
        <p className="text-sm text-default-500 mt-1">自定义您的应用体验</p>
      </div>
      <Divider className="my-2" />
      <div className="px-2">
        {menuItems.map((item) => (
          <div
            key={item.key}
            className={`flex items-center gap-3 px-4 py-3 my-1 rounded-lg cursor-pointer transition-colors ${
              activeTab === item.key
                ? "bg-primary/10 text-primary"
                : "hover:bg-default-100/50 text-default-700"
            }`}
            onClick={() => setActiveTab(item.key)}
          >
            <Icon icon={item.icon} width={20} />
            <span className="font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // 渲染通用设置内容
  const renderGeneralSettings = () => (
    <Card
      fullWidth
      className="overflow-hidden backdrop bg-white/80 dark:bg-default-100/20"
      radius="lg"
      shadow="md"
    >
      <div className="px-6 py-5 border-b dark:border-gray-800">
        <h2 className="text-xl font-semibold text-default-900">通用设置</h2>
        <p className="text-sm text-default-500 mt-1">
          管理应用的基本设置和偏好
        </p>
      </div>

      <CardBody className="p-0">
        <div className="divide-y dark:divide-gray-800">
          {settingItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-6 hover:bg-default-50/40 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-full bg-primary/10 text-primary">
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
  );

  // 渲染 AI 设置内容
  const renderAISettings = () => (
    <Card
      fullWidth
      className="overflow-hidden backdrop bg-white/80 dark:bg-default-100/20"
      radius="lg"
      shadow="md"
    >
      <div className="px-6 py-5 border-b dark:border-gray-800">
        <h2 className="text-xl font-semibold text-default-900">AI 设置</h2>
        <p className="text-sm text-default-500 mt-1">
          配置 AI 服务和模型选项
        </p>
      </div>

      <CardBody className="p-6">
        <RadioGroup
          className="space-y-6"
          color="primary"
          value={routeType}
          onValueChange={(value) => handleRouteTypeChange(value as AIRouteType)}
        >
          {/* 默认线路 */}
          <div className="p-4 rounded-xl border dark:border-default-700 hover:bg-default-50/40 transition-colors">
            <Radio
              description="免费的gpt-4o-mini，上下文限制"
              value="default"
            >
              <span className="text-lg font-medium">默认线路</span>
            </Radio>

            {routeType === "default" && (
              <div className="ml-7 mt-4 p-4 bg-default-100/50 rounded-lg">
                <div className="mb-2 text-sm text-default-600">
                  默认模型:{" "}
                  <span className="font-medium">{defaultRoute.model}</span>
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
                  模型，具有一定的上下文限制，但可以满足基本的 JSON 处理需求。
                </div>
              </div>
            )}
          </div>

          {/* Utools 官方 */}
          <div className="p-4 rounded-xl border dark:border-default-700 hover:bg-default-50/40 transition-colors">
            <Radio
              description="连接UtoolsAl，由utools官方收费"
              isDisabled={!isUtoolsAvailable}
              value="utools"
            >
              <span className="text-lg font-medium">Utools 官方</span>
            </Radio>

            {routeType === "utools" && (
              <div className="ml-7 mt-4 p-4 bg-default-100/50 rounded-lg">
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
                      <SelectItem key={item.value}>
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
                  Utools 官方线路由 Utools 团队维护，提供更稳定的服务和更多模型选择，但需要付费使用。
                </div>
              </div>
            )}
          </div>

          {/* 私有线路 */}
          <div className="p-4 rounded-xl border dark:border-default-700 hover:bg-default-50/40 transition-colors">
            <Radio description="自定义 API 地址和密钥" value="custom">
              <span className="text-lg font-medium">私有线路</span>
            </Radio>

            {routeType === "custom" && (
              <div className="ml-7 mt-4 p-4 bg-default-100/50 rounded-lg">
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
                  私有线路允许您使用自己的 API 密钥和自定义端点，支持 OpenAI 兼容的任何服务。
                </div>
              </div>
            )}
          </div>
        </RadioGroup>
      </CardBody>
    </Card>
  );

  // 渲染外观设置内容
  const renderAppearanceSettings = () => (
    <Card
      fullWidth
      className="overflow-hidden backdrop bg-white/80 dark:bg-default-100/20"
      radius="lg"
      shadow="md"
    >
      <div className="px-6 py-5 border-b dark:border-gray-800">
        <h2 className="text-xl font-semibold text-default-900">外观设置</h2>
        <p className="text-sm text-default-500 mt-1">
          自定义应用的外观和显示方式
        </p>
      </div>

      <CardBody className="p-6">
        {/* 聊天窗口样式设置 */}
        <div className="mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-default-900">聊天窗口样式</h3>
            <p className="text-sm text-default-500 mt-1">选择您喜欢的聊天界面显示风格</p>
          </div>
          
          <div className="flex gap-6 mt-4">
            <div
              aria-label="选择对话模式聊天样式"
              className={`flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 ${
                chatStyle === "bubble"
                  ? "scale-105 opacity-100"
                  : "opacity-70 hover:opacity-90"
              }`}
              role="button"
              tabIndex={0}
              onClick={() => handleSettingChange("chatStyle", "bubble" as ChatStyle)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                handleSettingChange("chatStyle", "bubble" as ChatStyle)
              }
            >
              <div
                className={`border p-3 rounded-lg w-32 h-24 flex items-center justify-center transition-colors duration-200 ${
                  chatStyle === "bubble"
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-default-200 dark:border-default-700"
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
              className={`flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 ${
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
                className={`border p-3 rounded-lg w-32 h-24 flex items-center justify-center transition-colors duration-200 ${
                  chatStyle === "document"
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-default-200 dark:border-default-700"
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

        {/* 可以添加更多外观设置项，如字体大小、布局等 */}
      </CardBody>
    </Card>
  );

  // 渲染关于内容
  const renderAboutContent = () => (
    <Card
      fullWidth
      className="overflow-hidden backdrop bg-white/80 dark:bg-default-100/20"
      radius="lg"
      shadow="md"
    >
      <div className="px-6 py-5 border-b dark:border-gray-800">
        <h2 className="text-xl font-semibold text-default-900">关于 JSON Tools Next</h2>
        <p className="text-sm text-default-500 mt-1">
          了解更多关于应用的信息
        </p>
      </div>

      <CardBody className="p-6">
        <div className="flex flex-col items-center text-center mb-6">
          <img src="/logo.png" alt="JSON Tools Logo" className="w-24 h-24 mb-4" />
          <h3 className="text-2xl font-bold text-default-900">JSON Tools Next</h3>
          <p className="text-default-600 mt-2">强大的 JSON 处理工具集</p>
          <div className="bg-default-100 px-3 py-1 rounded-full text-sm mt-2">
            版本 1.0.0
          </div>
        </div>

        <Divider className="my-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-medium text-default-900 mb-3">功能</h4>
            <ul className="space-y-2 text-default-700">
              <li className="flex items-center gap-2">
                <Icon icon="solar:check-circle-bold" className="text-success" />
                JSON 格式化与验证
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="solar:check-circle-bold" className="text-success" />
                智能 AI 辅助修复
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="solar:check-circle-bold" className="text-success" />
                数据格式转换
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="solar:check-circle-bold" className="text-success" />
                JWT 解析工具
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-medium text-default-900 mb-3">技术支持</h4>
            <div className="space-y-3">
              <a 
                href="https://github.com/yourusername/json-tools-next" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Icon icon="solar:github-bold" />
                GitHub 仓库
              </a>
              <a 
                href="https://github.com/yourusername/json-tools-next/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Icon icon="solar:chat-square-code-bold" />
                问题反馈
              </a>
              <a 
                href="https://yourdocs.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Icon icon="solar:document-bold" />
                使用文档
              </a>
            </div>
          </div>
        </div>

        <Divider className="my-6" />

        <div className="text-center text-sm text-default-500">
          <p>© {new Date().getFullYear()} JSON Tools Next. 保留所有权利。</p>
          <p className="mt-1">基于 React、TypeScript 和 HeroUI 构建</p>
        </div>
      </CardBody>
    </Card>
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
    <div className="w-full h-full flex-1 bg-default-50">
      <div className="flex h-full">
        {/* 侧边栏 */}
        {renderSidebar()}
        
        {/* 主内容区域 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <motion.div
            key={activeTab}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
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
