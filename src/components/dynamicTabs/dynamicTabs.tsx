"use client";

import React, { useRef, useEffect, useState, useImperativeHandle } from "react";
import { Tabs, Tab, Tooltip, Input, cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";

import { useTabStore, TabItem } from "@/store/useTabStore";
import { IcRoundClose } from "@/components/icons";

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
    addTabSimple,
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
  // 渲染重命名输入框
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
          >
            关闭
          </DropdownItem>
          <DropdownItem
            key="rename"
            startContent={<Icon icon="solar:pen-linear" width={18} />}
          >
            重命名
          </DropdownItem>
          <DropdownItem
            key="close-left"
            startContent={<Icon icon="ph:arrow-left" width={18} />}
          >
            关闭左侧
          </DropdownItem>
          <DropdownItem
            key="close-right"
            startContent={<Icon icon="ph:arrow-right" width={18} />}
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
          >
            关闭其他
          </DropdownItem>
          <DropdownItem
            key="close-all"
            color="danger"
            startContent={<Icon icon="gg:close" width={18} />}
          >
            关闭所有
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  return (
    <div className="flex flex-col overflow-hidden bg-default-100 border-b border-default-200 pb-0.5">
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
              addTabSimple();
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
    </div>
  );
};

export default DynamicTabs;
