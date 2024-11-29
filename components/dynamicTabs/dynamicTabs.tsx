"use client";

import React, { useRef, useEffect } from "react";
import { Tabs, Tab } from "@nextui-org/react";
import { Icon } from "@iconify/react";

import { useTabStore, TabItem } from "@/store/useTabStore";

const DynamicTabs: React.FC = () => {
  const { tabs, activeTab, addTab, closeTab, setActiveTab } = useTabStore();
  const tabListRef = useRef<HTMLDivElement>(null);

  // 自动滚动到活跃标签
  const scrollToActiveTab = () => {
    if (tabListRef.current) {
      const activeTabElement = tabListRef.current.querySelector(
        `[data-key="${activeTab}"]`,
      );

      if (activeTab === "add") {
        console.log("add tab");
        addTab();

        return;
      }

      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
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
      <Tabs
        ref={tabListRef}
        aria-label="动态标签页"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 px-4 overflow-x-auto flex-shrink-0",
          tab: "max-w-fit px-0 h-9 flex-shrink-0",
          cursor: "w-full",
          panel: "flex-grow overflow-auto border-t border-divider px-4",
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
          >
            <div className="h-full overflow-auto">{tab.content}</div>
          </Tab>
        ))}
        <Tab
          key="add"
          title={
            <div
              aria-label="添加新标签页"
              className="cursor-pointer px-2 py-3"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, addTab)}
            >
              <Icon icon="mi:add" width={24} />
            </div>
          }
          onClick={(e) => {
            addTab();
            e.stopPropagation();
          }}
        />
      </Tabs>
    </div>
  );
};

export default DynamicTabs;
