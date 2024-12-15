"use client";
"use client";

import {
  Button,
  Card,
  CardBody,
  Select,
  SelectItem,
  Switch,
} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { toast } from "react-toastify";

import { useSettingsStore } from "@/store/useSettingsStore";
import { storage } from "@/lib/indexedDBStore";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const {
    editDataSaveLocal,
    expandSidebar,
    monacoEditorCDN,
    setEditDataSaveLocal,
    setExpandSidebar,
    setMonacoEditorCDN,
  } = useSettingsStore();

  const editorLoadOptions = [
    { label: "本地嵌入", value: "local" },
    { label: "远程CDN", value: "cdn" },
  ];

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
    toast.success("本地存储已清除");
  };

  const reloadApp = () => {
    // 重载应用的逻辑
    location.reload();
  };

  return (
    <div className="w-full max-w-4xl flex-1 p-4">
      {/* Title */}
      <div className="ml-2">
        <div className="flex items-center gap-x-3">
          <h1 className="text-3xl font-bold leading-9 text-default-foreground">
            设置
          </h1>
          <Icon
            className="flex-none rotate-180 text-default-500"
            icon="solar:settings-outline"
            width={24}
          />
        </div>
        <h2 className="mt-2 text-small text-default-500 flex">
          自定义设置偏好，让你的编辑器更加舒适
        </h2>
      </div>

      <Card fullWidth className="mt-6 py-3 px-2" radius="sm" shadow="sm">
        <CardBody>
          <h2 className="text-lg font-medium text-default-900 mb-4">
            常规设置
          </h2>

          {/* 夜间模式 */}
          <div className="flex items-center justify-between py-3 border-b dark:border-default-200">
            <div>
              <p className="text-default-900">深色模式</p>
              <p className="text-sm text-default-500">切换深色主题以保护眼睛</p>
            </div>
            <Switch
              isSelected={theme === "dark"}
              onValueChange={(value) => setTheme(value ? "dark" : "light")}
            />
          </div>

          {/* 本地存储 */}
          <div className="flex items-center justify-between py-3 border-b dark:border-default-200">
            <div>
              <p className="text-default-900">本地存储</p>
              <p className="text-sm text-default-500">
                将编辑器数据存储在本地，关闭后刷新页面数据将丢失
              </p>
            </div>
            <Switch
              isSelected={editDataSaveLocal}
              onValueChange={(value) =>
                handleSettingChange("editDataSaveLocal", value)
              }
            />
          </div>

          {/* Tab展开 */}
          <div className="flex items-center justify-between py-3 border-b dark:border-default-200">
            <div>
              <p className="text-default-900">展开Tab栏</p>
              <p className="text-sm text-default-500">设置Tab栏是否默认展开</p>
            </div>
            <Switch
              isSelected={expandSidebar}
              onValueChange={(value) =>
                handleSettingChange("expandSidebar", value)
              }
            />
          </div>

          {/* 编辑器加载方式 */}
          <div className="flex items-center justify-between py-3 border-b dark:border-default-200">
            <div>
              <p className="text-default-900">编辑器加载方式</p>
              <p className="text-sm text-default-500">
                1. 本地加载，首屏加载速度快，暂不支持中文。
                <br />
                2. CDN(需联网)，首屏加载速度稍慢，支持中文。
              </p>
            </div>
            <Select
              className="w-[220px]"
              label="加载方式"
              selectedKeys={[monacoEditorCDN]}
              onChange={(e) =>
                handleSettingChange("monacoEditorCDN", e.target.value)
              }
            >
              {editorLoadOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* 编辑器加载方式 */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-default-900">重置应用</p>
              <p className="text-sm text-default-500">
                重置应用，清除本地存储，刷新页面后将重新加载应用。
              </p>
            </div>
            <Button
              color="danger"
              onPress={() => {
                removeStore();
              }}
            >
              重置应用
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
