import { Button, Card, CardBody, Switch, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

import toast from "@/utils/toast";
import { useSettingsStore, ChatStyle } from "@/store/useSettingsStore.ts";
import { storage } from "@/lib/indexedDBStore.ts";

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

  const { theme, setTheme } = useTheme();

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
