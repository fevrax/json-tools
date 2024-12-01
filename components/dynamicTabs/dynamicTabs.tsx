"use client";

import React, { useRef, useEffect, useState } from "react";
import { Tabs, Tab, Tooltip, Input, cn } from "@nextui-org/react";
import { Icon } from "@iconify/react";

import { useTabStore, TabItem } from "@/store/useTabStore";
import { IcRoundClose } from "@/components/icons";

const DynamicTabs: React.FC = () => {
  const { tabs, activeTabKey, addTab, closeTab, setActiveTab, renameTab } =
    useTabStore();
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tabRenameInputRef = useRef<HTMLInputElement>(null);
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
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
        addTab();

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
        <div className="flex items-center space-x-2 text-xs">
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center relative">
        <Tooltip content="新建标签页" placement="bottom-start">
          <div
            aria-label="添加新标签页"
            className="sticky left-0 z-50 bg-background cursor-pointer p-1 m-2 my-1 flex-shrink-0 hover:bg-default-200 rounded"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              addTab();
              e.stopPropagation();
            }}
            onKeyDown={(e) => handleKeyDown(e, addTab)}
          >
            <Icon icon="mi:add" width={22} />
          </div>
        </Tooltip>

        <div
          ref={tabContainerRef}
          className="flex-grow overflow-x-auto scroll-smooth scrollbar-hide"
          onWheel={handleWheel}
        >
          <Tabs
            ref={tabListRef}
            aria-label="动态标签页"
            classNames={{
              tabList:
                "gap-6 w-full relative rounded-none p-0 pr-4 overflow-x-visible flex-shrink-0",
              tab: "max-w-fit px-0 h-9 flex-shrink-0",
              cursor: "w-full",
              panel:
                "flex-grow overflow-auto border-t border-divider px-0 pb-0 pt-1",
            }}
            selectedKey={activeTabKey}
            variant="underlined"
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            {tabs.map((tab: TabItem, index: number) => (
              <Tab
                key={tab.key}
                data-key={tab.key}
                title={
                  <div
                    className={cn("flex items-center space-x-2 z-40", {
                      "opacity-0": editingTab === tab.key,
                    })}
                    role="button"
                    onDoubleClick={(e) => handleDoubleClick(tab, e)}
                  >
                    <>
                      <span>{tab.title}</span>
                      {tab.closable && (
                        <div
                          aria-label="关闭标签页"
                          className=" rounded-full cursor-pointer flex items-center justify-center z-10 py-3 px-1 !ml-0.5"
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            closeTab(tab.key);
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          onKeyDown={(e) => {
                            handleKeyDown(e, () => closeTab(tab.key));
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <IcRoundClose width={20} />
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
    </div>
  );
};

export default DynamicTabs;
