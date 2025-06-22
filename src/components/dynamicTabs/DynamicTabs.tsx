"use client";

import React, { useRef, useEffect, useState, useImperativeHandle } from "react";
import { Tabs, Tab, Tooltip, cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { Input, Button, Card } from "@heroui/react";

import toast from "@/utils/toast";
import { useTabStore, TabItem } from "@/store/useTabStore";
import { IcRoundClose } from "@/components/Icons.tsx";
import { JsonSample } from "@/utils/jsonSample.ts";

export interface DynamicTabsRef {
  getPositionTop: () => number;
}

export interface DynamicTabsProps {
  ref?: React.Ref<DynamicTabsRef>;
  onSwitch: (key: string) => void;
  onClose?: (keys: Array<string>) => void;
}

const DynamicTabs: React.FC<DynamicTabsProps> = ({
  onSwitch,
  onClose,
  ref,
}) => {
  const {
    tabs,
    activeTabKey,
    addTab,
    closeTab,
    setActiveTab,
    renameTab,
    closeAllTabs,
    closeLeftTabs,
    closeRightTabs,
    closeOtherTabs,
    getTabByKey,
  } = useTabStore();
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tabRenameInputRef = useRef<HTMLInputElement>(null);
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [contextMenuTabKey, setContextMenuTabKey] = useState<string>("");
  const [tabDisableKeys, setTabDisableKeys] = useState<string[]>([]);

  // 添加菜单相关状态
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);
  const [addMenuPosition, setAddMenuPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  const [inputPosition, setInputPosition] = useState<{
    left: number;
    top: number;
    width: number;
  }>({ left: 0, top: 0, width: 0 });

  const addButtonRef = useRef<HTMLDivElement>(null);

  // 精确计算标签页滚动位置
  const scrollToActiveTab = () => {
    if (tabListRef.current && tabContainerRef.current) {
      const activeTabElement = tabListRef.current.querySelector(
        `[data-key="${activeTabKey}"]`,
      ) as HTMLElement;

      if (activeTabKey === "add") {
        addTab(undefined, undefined);

        return;
      }

      if (activeTabElement) {
        const containerRect = tabContainerRef.current.getBoundingClientRect();
        const tabListRect = tabListRef.current.getBoundingClientRect();

        // 计算相对于容器的偏移量
        const tabOffset = activeTabElement.offsetLeft;
        const tabWidth = activeTabElement.offsetWidth;

        // 容器的可视宽度
        const containerWidth = containerRect.width;

        // 计算滚动位置，确保标签尽可能居中
        let scrollPosition = tabOffset - containerWidth / 2 + tabWidth / 2;

        // 处理边界情况
        scrollPosition = Math.max(0, scrollPosition);
        const maxScrollPosition = tabListRect.width - containerWidth;

        scrollPosition = Math.min(scrollPosition, maxScrollPosition);

        tabContainerRef.current.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
      }
    }
  };

  // 处理鼠标滚轮滚动
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (tabContainerRef.current) {
      e.preventDefault();
      // 使用更平滑的滚动方式，可以调整滚动速度
      const scrollAmount = e.deltaY > 0 ? 100 : -100;

      tabContainerRef.current.scrollLeft += scrollAmount;
    }
  };

  useEffect(() => {
    scrollToActiveTab();
    onSwitch(activeTabKey);
  }, [activeTabKey]);

  useEffect(() => {
    if (editingTab && tabRenameInputRef.current) {
      tabRenameInputRef.current.focus();
    }
  }, [editingTab]);

  // 键盘事件处理函数
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    action: () => void,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  // 处理双击重命名
  const handleDoubleClick = (tab: TabItem, event: React.MouseEvent) => {
    const targetElement = event.currentTarget;
    const rect = targetElement.getBoundingClientRect();

    setEditingTab(tab.key);
    setEditingTitle(tab.title);

    // 设置输入框位置和宽度
    setInputPosition({
      left: rect.left,
      top: rect.top,
      width: rect.width,
    });
  };

  const handleContextMenu = (
    tab: TabItem,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    setContextMenuPosition({
      x: event.clientX,
      y: event.clientY,
    });
    setContextMenuTabKey(tab.key);
  };

  // 处理输入框的键盘事件
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      confirmRename();
    } else if (e.key === "Escape") {
      setEditingTab(null);
    }
  };

  // 确认重命名
  const confirmRename = () => {
    if (editingTab) {
      renameTab(editingTab, editingTitle);
      setEditingTab(null);
    }
  };

  // 菜单事件处理
  const handleMenuAction = (action: string) => {
    if (!contextMenuTabKey) return;

    switch (action) {
      case "rename":
        // 触发重命名逻辑（复用现有的双击重命名逻辑）
        const tabElement = document.querySelector(
          `[data-key="${contextMenuTabKey}"]`,
        );

        if (tabElement) {
          const rect = tabElement.getBoundingClientRect();

          setEditingTab(contextMenuTabKey);
          const tab = getTabByKey(contextMenuTabKey);

          if (tab) {
            setEditingTitle(tab.title);

            // 设置输入框位置和宽度
            setInputPosition({
              left: rect.left,
              top: rect.top,
              width: rect.width,
            });
          }
        }
        break;
      case "close":
        closeTab(contextMenuTabKey);
        onClose?.([contextMenuTabKey]);
        break;
      case "close-left":
        const closeLeftKeys = closeLeftTabs(contextMenuTabKey);

        onClose?.(closeLeftKeys);
        break;
      case "close-right":
        const closeRightKeys = closeRightTabs(contextMenuTabKey);

        onClose?.(closeRightKeys);
        break;
      case "close-others":
        const closeOtherKeys = closeOtherTabs(contextMenuTabKey);

        onClose?.(closeOtherKeys);
        break;
      case "close-all":
        const closeAllKeys = closeAllTabs();

        onClose?.(closeAllKeys);
        break;
    }
  };

  // 添加菜单相关状态
  const [jsonUrl, setJsonUrl] = useState<string>("");

  // 处理添加菜单选项
  const handleAddMenuAction = (action: string) => {
    switch (action) {
      case "upload":
        // 触发文件上传
        const fileInput = document.createElement("input");

        fileInput.type = "file";
        fileInput.accept = "application/json";
        fileInput.onchange = (e) => {
          const target = e.target as HTMLInputElement;

          if (target.files && target.files.length > 0) {
            const file = target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
              try {
                const content = event.target?.result as string;

                // 创建新标签并设置内容
                addTab(file.name, content);
                setShowAddMenu(false);
                toast.success("文件上传成功");
              } catch (error) {
                toast.error(
                  "文件处理失败",
                  error instanceof Error ? error.message : "请确保文件格式正确",
                );
              }
            };

            reader.onerror = () => {
              toast.error("文件读取失败", "请确保文件可访问且格式正确");
            };

            reader.readAsText(file);
          }
        };
        fileInput.click();
        break;
      case "sample":
        addTab("Sample JSON", JsonSample);
        break;
    }
  };

  // 处理URL输入
  const handleUrlSubmit = async () => {
    if (!jsonUrl.trim()) {
      return;
    }

    try {
      const response = await axios.get(jsonUrl, {
        headers: {
          Accept: "application/json",
        },
        responseType: "text",
      });

      // 检查响应类型
      const contentType = response.headers["content-type"];

      if (contentType && contentType.includes("application/json")) {
        const jsonText = response.data;

        // 创建URL的文件名
        const urlObj = new URL(jsonUrl);
        const pathParts = urlObj.pathname.split("/");
        let fileName = pathParts[pathParts.length - 1] || urlObj.hostname;

        if (!fileName.toLowerCase().endsWith(".json")) {
          fileName += ".json";
        }

        // 创建新标签并设置内容
        addTab(fileName, jsonText);

        // 关闭菜单并清空URL
        setShowAddMenu(false);
        setJsonUrl("");
      } else {
        throw new Error("响应不是JSON格式");
      }
    } catch (error) {
      console.error("获取JSON失败:", error);
      toast.error(
        "获取JSON失败",
        error instanceof Error ? error.message : "请检查URL是否正确",
      );
    }
  };

  // 使用 useImperativeHandle 暴露方法
  useImperativeHandle(ref, () => ({
    getPositionTop: () => {
      if (!tabContainerRef.current) return 35;
      const containerRect = tabContainerRef.current.getBoundingClientRect();

      return containerRect.bottom;
    },
  }));

  // 渲染重命名输入框
  const renderRenameInput = () => {
    if (!editingTab) return null;

    return (
      <div
        className="absolute"
        style={{
          position: "fixed",
          left: `${inputPosition.left}px`,
          top: `2px`,
          width: `${inputPosition.width}px`,
          zIndex: 1000,
        }}
      >
        <div className="flex items-center space-x-2">
          <Input
            ref={tabRenameInputRef}
            classNames={{
              input: "text-xs !pe-0",
              inputWrapper: "px-0 pl-0.5",
            }}
            endContent={
              <Tooltip content="确认">
                <div
                  className="cursor-pointer hover:bg-default-100 rounded-full"
                  role="button"
                  tabIndex={0}
                  onClick={confirmRename}
                  onKeyDown={confirmRename}
                >
                  <Icon icon="mage:check" width={20} />
                </div>
              </Tooltip>
            }
            size="sm"
            value={editingTitle}
            onBlur={confirmRename}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
        </div>
      </div>
    );
  };

  // 添加外部点击关闭菜单的处理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if ((event.target as Element).closest('[aria-label="添加新标签页"]')) {
        return;
      }

      if (
        contextMenuPosition &&
        !(event.target as Element).closest(".tab-context-menu")
      ) {
        setContextMenuPosition(null);
        setContextMenuTabKey("");
      }

      if (showAddMenu && !(event.target as Element).closest(".add-menu")) {
        setShowAddMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenuPosition, showAddMenu]);

  // 修改右键菜单样式
  const renderTabContextMenu = () => {
    // 即使没有contextMenuPosition，也要渲染菜单但使其不可见，以支持动画
    return (
              <div
        className={cn(
          "tab-context-menu fixed bg-default-50 border border-divider rounded-lg shadow-xl z-50",
          "transition-all duration-200 ease-in-out",
          contextMenuPosition
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none",
        )}
        style={{
          left: contextMenuPosition?.x || 0,
          top: contextMenuPosition?.y || 0,
          minWidth: "220px",
          transformOrigin: "top left",
        }}
      >
        <div className="py-1.5">
          <button
            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-default-100 text-sm transition-colors"
            onClick={() => handleMenuAction("close")}
          >
            <div className="w-5 h-5 flex items-center justify-center text-default-600">
              <Icon icon="gg:close" width={18} />
            </div>
            <span>关闭</span>
          </button>
          <button
            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-default-100 text-sm transition-colors"
            onClick={() => handleMenuAction("rename")}
          >
            <div className="w-5 h-5 flex items-center justify-center text-default-600">
              <Icon icon="solar:pen-linear" width={18} />
            </div>
            <span>重命名</span>
          </button>
          <hr className="my-1 border-divider opacity-60" />
          <button
            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-default-100 text-sm transition-colors"
            onClick={() => handleMenuAction("close-left")}
          >
            <div className="w-5 h-5 flex items-center justify-center text-default-600">
              <Icon icon="ph:arrow-left" width={18} />
            </div>
            <span>关闭左侧</span>
          </button>
          <button
            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-default-100 text-sm transition-colors"
            onClick={() => handleMenuAction("close-right")}
          >
            <div className="w-5 h-5 flex items-center justify-center text-default-600">
              <Icon icon="ph:arrow-right" width={18} />
            </div>
            <span>关闭右侧</span>
          </button>
          <button
            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-default-100 text-sm transition-colors"
            onClick={() => handleMenuAction("close-others")}
          >
            <div className="w-5 h-5 flex items-center justify-center text-default-600">
              <Icon
                icon="material-symbols:tab-close-inactive-outline"
                width={18}
              />
            </div>
            <span>关闭其他</span>
          </button>
          <hr className="my-1 border-divider opacity-60" />
          <button
            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-danger/10 text-sm text-danger transition-colors"
            onClick={() => handleMenuAction("close-all")}
          >
            <div className="w-5 h-5 flex items-center justify-center text-danger">
              <Icon icon="gg:close" width={18} />
            </div>
            <span>关闭所有</span>
          </button>
        </div>
      </div>
    );
  };

  // 修改添加菜单显示逻辑
  const toggleAddMenu = () => {
    if (addButtonRef.current) {
      const buttonRect = addButtonRef.current.getBoundingClientRect();
      const newPosition = {
        x: buttonRect.left,
        y: buttonRect.bottom + 5,
      };

      setAddMenuPosition(newPosition);

      // 延迟setState以确保事件处理顺序正确
      setTimeout(() => {
        setShowAddMenu((prevState) => !prevState);
      }, 0);
    }
  };

  // 确保在组件挂载后和窗口大小变化时更新菜单位置
  useEffect(() => {
    const updateAddMenuPosition = () => {
      if (addButtonRef.current) {
        const buttonRect = addButtonRef.current.getBoundingClientRect();

        setAddMenuPosition({
          x: buttonRect.left,
          y: buttonRect.bottom + 5,
        });
      }
    };

    // 初始化位置
    updateAddMenuPosition();

    // 监听窗口大小变化，更新位置
    window.addEventListener("resize", updateAddMenuPosition);

    return () => {
      window.removeEventListener("resize", updateAddMenuPosition);
    };
  }, []);

  // 右键菜单显示时更新位置
  useEffect(() => {
    if (showAddMenu && addButtonRef.current) {
      const buttonRect = addButtonRef.current.getBoundingClientRect();

      setAddMenuPosition({
        x: buttonRect.left - 10,
        y: buttonRect.bottom + 8,
      });
    }
  }, [showAddMenu]);

  // 渲染菜单
  const renderAddMenu = () => {
    return (
      <div
        className={cn(
          "add-menu fixed bg-default-50 border border-divider rounded-xl shadow-xl z-50",
          "transition-all duration-300 ease-in-out",
          "before:absolute before:w-3 before:h-3 before:bg-default-50 before:rotate-45 before:-top-1.5 before:left-5 before:border-t before:border-l before:border-divider",
          showAddMenu
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none",
        )}
        style={{
          left: addMenuPosition.x,
          top: addMenuPosition.y,
          minWidth: "480px",
          transformOrigin: "top left",
        }}
      >
        <div className="p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-default-700">
              <Icon className="text-indigo-500" icon="solar:magic-stick-linear" />
              快速创建
            </h3>
            <div className="border-b border-divider pb-5">
              <div className="flex gap-3 w-full">
                <Button
                  className="flex-1 h-28 flex-col px-3 py-2 transition-all hover:scale-[1.02] bg-gradient-to-br from-default-50 to-default-100 hover:bg-gradient-to-br hover:from-primary-50/30 hover:to-default-100 hover:shadow-sm hover:border-primary-100 justify-center items-center"
                  startContent={
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                      <Icon
                        className="text-xl text-indigo-500"
                        icon="carbon:document-blank"
                      />
                    </div>
                  }
                  variant="flat"
                  onPress={() => {
                    addTab("", "");
                    setShowAddMenu(false);
                  }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium">新建 Tab</span>
                    <span className="text-xs text-default-500">
                      创建空白 Tab 标签页
                    </span>
                  </div>
                </Button>
                <Button
                  className="flex-1 h-28 flex-col px-3 py-2 transition-all hover:scale-[1.02] bg-gradient-to-br from-default-50 to-default-100 hover:bg-gradient-to-br hover:from-primary-50/30 hover:to-default-100 hover:shadow-sm hover:border-primary-100 justify-center items-center"
                  startContent={
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                      <Icon
                        className="text-xl text-indigo-500"
                        icon="ri:file-code-line"
                      />
                    </div>
                  }
                  variant="flat"
                  onPress={() => {
                    handleAddMenuAction("sample");
                    setShowAddMenu(false);
                  }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium">JSON 示例</span>
                    <span className="text-xs text-default-500">
                      包含常用字段
                    </span>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-default-700">
              <Icon className="text-indigo-500" icon="solar:link-circle-linear" />
              从 URL 获取 JSON
            </h3>
            <div className="border-b border-divider pb-5">
              <div className="w-full flex flex-col gap-2">
                <Input
                  classNames={{
                    inputWrapper: "shadow-sm bg-default-100 border-divider",
                    input: "focus:ring-0",
                  }}
                  endContent={
                    <Button
                      className="bg-indigo-500 border-0"
                      color="primary"
                      isDisabled={!jsonUrl.trim()}
                      radius="sm"
                      size="sm"
                      onPress={handleUrlSubmit}
                    >
                      <span className="px-1">获取</span>
                    </Button>
                  }
                  placeholder="输入 JSON 链接地址"
                  startContent={
                    <Icon
                      className="text-default-400"
                      icon="solar:link-linear"
                      width={18}
                    />
                  }
                  value={jsonUrl}
                  variant="flat"
                  onChange={(e) => setJsonUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUrlSubmit();
                    }
                  }}
                />
                <p className="text-xs text-default-400 px-1">
                  支持任何公开的 JSON 资源 URL，系统将自动解析并加载
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-default-700">
              <Icon className="text-indigo-500" icon="solar:upload-linear" />
              文件操作
            </h3>
            <div className="flex justify-center">
              <Card
                isPressable
                className="border-2 border-dashed border-default-200 rounded-xl hover:border-indigo-500  hover:bg-primary-50/10 dark:hover:bg-primary-900/20 transition-all duration-300 w-full py-5 cursor-pointer"
                onPress={() => {
                  const fileInput = document.createElement("input");

                  fileInput.type = "file";
                  fileInput.accept = "application/json";
                  fileInput.onchange = (e) => {
                    const target = e.target as HTMLInputElement;

                    if (target.files && target.files.length > 0) {
                      const file = target.files[0];
                      const reader = new FileReader();

                      reader.onload = (event) => {
                        try {
                          const content = event.target?.result as string;

                          addTab(file.name, content);
                          setShowAddMenu(false);
                          toast.success("文件上传成功");
                        } catch (error) {
                          toast.error(
                            "文件处理失败",
                            error instanceof Error
                              ? error.message
                              : "请确保文件格式正确",
                          );
                        }
                      };

                      reader.onerror = () => {
                        toast.error(
                          "文件读取失败",
                          "请确保文件可访问且格式正确",
                        );
                      };

                      reader.readAsText(file);
                    }
                  };
                  fileInput.click();
                }}
              >
                <div className="flex flex-col items-center justify-center gap-3 w-full">
                  <div className="p-3.5 rounded-full bg-primary-50 text-indigo-500">
                    <Icon icon="heroicons:document-arrow-up" width={20} />
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-sm font-medium">上传 JSON 文件</p>
                    <p className="text-xs text-default-500">
                      或将JSON文件拖放到任意区域
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 拖拽状态
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 处理文件拖放
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(
        (file) =>
          file.type === "application/json" || file.name.endsWith(".json"),
      );

      if (files.length === 0) {
        toast.warning("未找到有效的JSON文件", "请确保拖放的是JSON文件");

        return;
      }

      // 处理每个文件
      files.forEach((file) => {
        const reader = new FileReader();

        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;

            // 创建新标签并设置内容
            addTab(file.name, content);
            setShowAddMenu(false);
            toast.success("文件上传成功");
          } catch (error) {
            toast.error(
              "文件处理失败",
              error instanceof Error ? error.message : "请确保文件格式正确",
            );
          }
        };

        reader.onerror = () => {
          toast.error("文件读取失败", "请确保文件可访问且格式正确");
        };

        reader.readAsText(file);
      });
    }
  };

  // 处理拖拽进入
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // 处理拖拽离开
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // 处理拖拽经过
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden border-b border-default-200 pb-0.5 relative",
        {
          "bg-default-100": !isDragging,
          "bg-primary-50/40 dark:bg-primary-900/20": isDragging,
        },
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleFileDrop}
    >
      <div className="flex items-center relative">
        <div className="sticky left-0 z-10 h-full flex items-center pr-1 shadow-[4px_0_8px_-1px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_8px_-1px_rgba(0,0,0,0.2)]">
          <div
            ref={addButtonRef}
            aria-label="添加新标签页"
            className="sticky left-0 z-50 cursor-pointer p-1.5 ml-1.5 flex-shrink-0 bg-default-100 hover:bg-default-200 rounded-lg text-default-600 transition-colors"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleAddMenu();
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleAddMenu();
            }}
            onKeyDown={(e) =>
              handleKeyDown(e, () => {
                toggleAddMenu();
              })
            }
          >
            <Icon icon="solar:add-square-linear" width={22} />
          </div>
        </div>

        <div
          ref={tabContainerRef}
          className="flex-grow h-10 overflow-x-auto scroll-smooth scrollbar-hide"
          onWheel={handleWheel}
        >
          <Tabs
            ref={tabListRef}
            aria-label="标签页"
            classNames={{
              tabList:
                "gap-1 w-full h-10 relative rounded-none p-0 pr-4 ml-2 overflow-x-visible flex-shrink-0",
              tab: "max-w-fit px-1.5 h-10 flex-shrink-0 data-[hover=true]:bg-default-100 rounded-t-md transition-colors",
              cursor: "w-full",
              panel:
                "flex-grow overflow-auto border-t border-divider px-0 pb-0 pt-1",
            }}
            disabledKeys={tabDisableKeys}
            selectedKey={activeTabKey}
            variant="underlined"
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            {tabs.map((tab: TabItem) => (
              <Tab
                key={tab.key}
                title={
                  <div
                    className={cn("flex items-center space-x-2 z-40", {
                      "opacity-0": editingTab === tab.key,
                    })}
                    data-key={tab.key}
                    role="button"
                    tabIndex={0}
                    onContextMenu={(e) => handleContextMenu(tab, e)}
                    onDoubleClick={(e) => handleDoubleClick(tab, e)}
                  >
                    <>
                      <span className="select-none text-sm">{tab.title}</span>
                      {tab.closable && (
                        <div
                          aria-label="关闭标签页"
                          className="rounded-full cursor-pointer flex items-center justify-center z-10 h-6 px-1 !ml-1 text-default-400 hover:text-default-600 hover:bg-default-200 transition-colors"
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            closeTab(tab.key);
                            onClose?.([tab.key]);
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          onKeyDown={(e) => {
                            handleKeyDown(e, () => {
                              closeTab(tab.key);
                              onClose?.([tab.key]);
                            });
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          onMouseEnter={() => setTabDisableKeys([tab.key])}
                          onMouseLeave={() => setTabDisableKeys([])}
                        >
                          <IcRoundClose width={16} />
                        </div>
                      )}
                    </>
                  </div>
                }
              />
            ))}
          </Tabs>
        </div>
      </div>

      {/* 拖放区域指示器 */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary-50/40 dark:bg-primary-800/30 border-2 border-dashed border-primary/50 dark:border-primary-400/70 rounded-lg flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-background/90 dark:bg-background/80 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <Icon className="text-primary text-xl" icon="solar:upload-linear" />
            <span className="text-sm font-medium">释放鼠标上传JSON文件</span>
          </div>
        </div>
      )}

      {/* 渲染重命名输入框 */}
      {renderRenameInput()}
      {renderTabContextMenu()}
      {renderAddMenu()}
    </div>
  );
};

export default DynamicTabs;
