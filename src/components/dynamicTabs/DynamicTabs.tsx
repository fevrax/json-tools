"use client";

import React, { useRef, useEffect, useState, useImperativeHandle } from "react";
import { Tabs, Tab, Tooltip, cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Input,
  Button,
  Card,
} from "@heroui/react";

import { useTabStore, TabItem } from "@/store/useTabStore";
import { IcRoundClose } from "@/components/Icons.tsx";

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
  const [contextMenuPosition, setContextMenuPosition] = useState<number>(0);
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
    const targetElement = event.currentTarget;
    const rect = targetElement.getBoundingClientRect();

    // 设置输入框位置和宽度
    setContextMenuPosition(rect.left);
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
    setShowAddMenu(false);

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
              const content = event.target?.result as string;

              // 创建新标签并设置内容
              addTab(file.name, content);
            };
            reader.readAsText(file);
          }
        };
        fileInput.click();
        break;
      case "sample":
        // 添加示例JSON标签页
        addTab(
          "示例JSON",
          JSON.stringify(
            {
              name: "示例JSON",
              description: "这是一个JSON示例",
              type: "object",
              properties: {
                id: {
                  type: "integer",
                  description: "唯一标识符",
                },
                name: {
                  type: "string",
                  description: "名称",
                },
                timestamp: {
                  type: "integer",
                  description: "时间戳",
                  example: 1625097600000,
                },
                tags: {
                  type: "array",
                  description: "标签列表",
                  items: {
                    type: "string",
                  },
                },
              },
            },
            null,
            2,
          ),
        );
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
      // 这里可以添加错误提示，如使用toast组件
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

  // 渲染标签页右键菜单
  const renderTabContextMenu = () => {
    if (!contextMenuTabKey) return null;

    return (
      <Dropdown
        isOpen={true}
        placement="bottom-start"
        onClose={() => setContextMenuTabKey("")}
      >
        <DropdownTrigger
          style={{
            position: "fixed",
            left: contextMenuPosition,
            top: 36, // 如果有bug 就采用动态获取
          }}
        >
          <span />
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Tab Context Menu"
          onAction={(key) => handleMenuAction(key as string)}
        >
          <DropdownItem
            key="close"
            startContent={<Icon icon="gg:close" width={18} />}
            textValue="关闭"
          >
            关闭
          </DropdownItem>
          <DropdownItem
            key="rename"
            startContent={<Icon icon="solar:pen-linear" width={18} />}
            textValue="重命名"
          >
            重命名
          </DropdownItem>
          <DropdownItem
            key="close-left"
            startContent={<Icon icon="ph:arrow-left" width={18} />}
            textValue="关闭左侧"
          >
            关闭左侧
          </DropdownItem>
          <DropdownItem
            key="close-right"
            startContent={<Icon icon="ph:arrow-right" width={18} />}
            textValue="关闭右侧"
          >
            关闭右侧
          </DropdownItem>
          <DropdownItem
            key="close-others"
            startContent={
              <Icon
                icon="material-symbols:tab-close-inactive-outline"
                width={18}
              />
            }
            textValue="关闭其他"
          >
            关闭其他
          </DropdownItem>
          <DropdownItem
            key="close-all"
            color="danger"
            startContent={<Icon icon="gg:close" width={18} />}
            textValue="关闭所有"
          >
            关闭所有
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  // 渲染添加按钮右键菜单
  const renderAddMenu = () => {
    if (!showAddMenu) return null;

    return (
      <Dropdown
        showArrow
        classNames={{
          base: "before:bg-default-200",
          content: "p-0 border-small border-divider bg-background",
        }}
        isOpen={true}
        placement="bottom-start"
        onClose={() => setShowAddMenu(false)}
      >
        <DropdownTrigger
          style={{
            position: "fixed",
            left: addMenuPosition.x,
            top: addMenuPosition.y,
          }}
        >
          <span />
        </DropdownTrigger>
        <DropdownMenu
          aria-label="新建JSON"
          className="p-4 min-w-[460px]"
          itemClasses={{
            base: [
              "rounded-md",
              "text-default-500",
              "transition-opacity",
              "data-[hover=true]:text-foreground",
              "data-[hover=true]:bg-default-100",
              "dark:data-[hover=true]:bg-default-50",
              "data-[selectable=true]:focus:bg-default-50",
              "data-[pressed=true]:opacity-70",
              "data-[focus-visible=true]:ring-default-500",
            ],
          }}
        >
          <DropdownSection showDivider title="从URL获取JSON">
            <DropdownItem
              key="url-input"
              isReadOnly
              className="h-auto gap-2 opacity-100 cursor-default"
              textValue="从URL获取JSON"
            >
              <div className="w-full flex flex-col gap-2">
                <Input
                  classNames={{
                    inputWrapper: "no-animation",
                    input: "focus:ring-0",
                  }}
                  endContent={
                    <Button
                      color="primary"
                      isDisabled={!jsonUrl.trim()}
                      size="sm"
                      onPress={handleUrlSubmit}
                    >
                      获取
                    </Button>
                  }
                  label="JSON URL"
                  placeholder="输入JSON链接地址"
                  value={jsonUrl}
                  variant="bordered"
                  onChange={(e) => setJsonUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUrlSubmit();
                    }
                  }}
                />
              </div>
            </DropdownItem>
          </DropdownSection>

          <DropdownSection showDivider title="文件操作">
            <DropdownItem
              key="file-upload"
              isReadOnly
              className="h-auto gap-2 opacity-100 cursor-default"
              textValue="文件上传"
            >
              <Card
                isPressable
                className="border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary-50/10 transition-colors w-full py-4 cursor-pointer"
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
                        const content = event.target?.result as string;

                        addTab(file.name, content);
                      };
                      reader.readAsText(file);
                    }
                  };
                  fileInput.click();
                  setShowAddMenu(false);
                }}
              >
                <div className="flex flex-col items-center justify-center gap-2 px-4">
                  <div className="p-3 rounded-full bg-primary-50 text-primary">
                    <Icon icon="heroicons:document-arrow-up" width={24} />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-medium">点击上传JSON文件</p>
                    <p className="text-xs text-default-500">
                      或拖拽文件到此区域
                    </p>
                  </div>
                </div>
              </Card>
            </DropdownItem>
          </DropdownSection>

          <DropdownSection title="快速创建">
            <DropdownItem
              key="template-buttons"
              isReadOnly
              className="h-auto gap-2 opacity-100 cursor-default"
              textValue="快速创建"
            >
              <div className="flex gap-3 w-full">
                <Button
                  className="flex-1 h-20 flex-col px-3"
                  startContent={
                    <Icon className="text-xl" icon="ri:file-code-line" />
                  }
                  variant="flat"
                  onPress={() => {
                    handleAddMenuAction("sample");
                    setShowAddMenu(false);
                  }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium">示例JSON</span>
                    <span className="text-xs text-default-500">
                      包含常用字段
                    </span>
                  </div>
                </Button>
                <Button
                  className="flex-1 h-20 flex-col px-3"
                  startContent={
                    <Icon className="text-xl" icon="carbon:document-blank" />
                  }
                  variant="flat"
                  onPress={() => {
                    addTab("新建JSON", "{}");
                    setShowAddMenu(false);
                  }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium">空白JSON</span>
                    <span className="text-xs text-default-500">创建空文档</span>
                  </div>
                </Button>
              </div>
            </DropdownItem>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>
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
        // 可以添加提示，未找到有效的JSON文件
        return;
      }

      // 处理每个文件
      files.forEach((file) => {
        const reader = new FileReader();

        reader.onload = (event) => {
          const content = event.target?.result as string;

          // 创建新标签并设置内容
          addTab(file.name, content);
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
        "flex flex-col overflow-hidden border-b border-default-200 pb-0.5",
        {
          "bg-default-100": !isDragging,
          "bg-primary-50 dark:bg-primary-900/20": isDragging,
        },
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleFileDrop}
    >
      <div className="flex items-center relative">
        <div
          style={
            {
              // boxShadow: "4px 0 6px -1px rgba(0, 0, 0, 0.1)",
            }
          }
        >
          <div
            aria-label="添加新标签页"
            className="sticky left-0 z-50 cursor-pointer p-0.5 ml-2 flex-shrink-0 bg-default-100 hover:bg-default-200 rounded text-default-600"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              addTab(undefined, undefined);
              e.stopPropagation();
            }}
            onContextMenu={(e) => {
              setAddMenuPosition({ x: e.clientX, y: e.clientY });
              setShowAddMenu(true);
              e.preventDefault();
            }}
            onKeyDown={(e) =>
              handleKeyDown(e, () => {
                addTab(undefined, undefined);
              })
            }
          >
            <Icon icon="mi:add" width={22} />
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
                "gap-6 w-full h-10 relative rounded-none p-0 pr-4 ml-4 overflow-x-visible flex-shrink-0",
              tab: "max-w-fit px-0 h-10 flex-shrink-0",
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
                      <span className="select-none">{tab.title}</span>
                      {tab.closable && (
                        <div
                          aria-label="关闭标签页"
                          className=" rounded-full cursor-pointer flex items-center justify-center z-10 h-10 px-1 !ml-0.5 text-default-500"
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
                          <IcRoundClose width={18} />
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
      {/* 渲染重命名输入框 */}
      {renderRenameInput()}
      {renderTabContextMenu()}
      {renderAddMenu()}
    </div>
  );
};

export default DynamicTabs;
