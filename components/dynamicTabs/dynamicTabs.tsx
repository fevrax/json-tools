"use client";

import React, { useRef, useEffect } from "react";
import { Tabs, Tab, Tooltip } from "@nextui-org/react";
import { Icon } from "@iconify/react";

import { useTabStore, TabItem } from "@/store/useTabStore";

const DynamicTabs: React.FC = () => {
  const { tabs, activeTab, addTab, closeTab, setActiveTab } = useTabStore();
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);

  // 精确计算标签页滚动位置
  const scrollToActiveTab = () => {
    if (tabListRef.current && tabContainerRef.current) {
      const activeTabElement = tabListRef.current.querySelector(
        `[data-key="${activeTab}"]`,
      ) as HTMLElement;

      if (activeTab === "add") {
        addTab();

        return;
      }

      if (activeTabElement) {
        const containerRect = tabContainerRef.current.getBoundingClientRect();
        const activeTabRect = activeTabElement.getBoundingClientRect();
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
      tabContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  useEffect(() => {
    scrollToActiveTab();
  }, [activeTab]);

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
            selectedKey={activeTab}
            variant="underlined"
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            {tabs.map((tab: TabItem) => (
              <Tab
                key={tab.key}
                className="z-20"
                data-key={tab.key}
                title={
                  <div className="flex items-center space-x-2 z-40">
                    <span>{tab.title}</span>
                    {tab.closable && (
                      <div
                        aria-label="关闭标签页"
                        className="hover:bg-default-100 rounded-full cursor-pointer flex items-center justify-center z-10"
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(tab.key);
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          handleKeyDown(e, () => closeTab(tab.key));
                        }}
                      >
                        <Icon icon="line-md:close" width={16} />
                      </div>
                    )}
                  </div>
                }
              />
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DynamicTabs;
