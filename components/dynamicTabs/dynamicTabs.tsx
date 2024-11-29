"use client";

import React, { useState, useRef, useEffect } from "react";
import { Tabs, Tab } from "@nextui-org/react";
import { Icon } from "@iconify/react";

// 定义标签页接口
interface TabItem {
  key: string;
  title: string;
  content: string;
  closable?: boolean;
}

const DynamicTabs: React.FC = () => {
  const [tabs, setTabs] = useState<TabItem[]>([
    { key: "1", title: "首页", content: "首页内容", closable: true },
    { key: "2", title: "仪表盘", content: "仪表盘内容", closable: true },
    { key: "3", title: "仪表盘", content: "仪表盘内容", closable: true },
    { key: "4", title: "仪表盘", content: "仪表盘内容", closable: true },
    { key: "5", title: "仪表盘", content: "仪表盘内容", closable: true },
    { key: "6", title: "仪表盘", content: "仪表盘内容", closable: true },
    { key: "7", title: "仪表盘", content: "仪表盘内容", closable: true },
    { key: "8", title: "仪表盘", content: "仪表盘内容", closable: true },
    { key: "9", title: "仪表盘", content: "仪表盘内容", closable: true },
  ]);
  const [activeTab, setActiveTab] = useState("1");
  const tabListRef = useRef<HTMLDivElement>(null);

  // 添加新标签页的函数
  const handleAddTab = () => {
    const newTabKey = (tabs.length + 1).toString();
    const newTab: TabItem = {
      key: newTabKey,
      title: `新标签页 ${newTabKey}`,
      content: `新标签页 ${newTabKey} 的内容`,
      closable: true,
    };

    setTabs([...tabs, newTab]);
    setActiveTab(newTabKey);
  };

  // 关闭标签页的函数
  const handleCloseTab = (keyToRemove: string) => {
    const updatedTabs = tabs.filter((tab) => tab.key !== keyToRemove);

    setTabs(updatedTabs);

    // 如果关闭的是当前活跃标签页，则切换到最后一个标签页
    if (keyToRemove === activeTab) {
      setActiveTab(updatedTabs[updatedTabs.length - 1]?.key || "1");
    }
  };

  // 自动滚动到活跃标签
  const scrollToActiveTab = () => {
    if (tabListRef.current) {
      const activeTabElement = tabListRef.current.querySelector(
        `[data-key="${activeTab}"]`,
      );

      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
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
            "gap-6 w-full relative rounded-none p-0 px-2 overflow-x-auto flex-shrink-0",
          tab: "max-w-fit px-0 h-12 flex-shrink-0",
          cursor: "w-full",
          panel: "flex-grow overflow-auto border-t border-divider p-4", // 添加面板内边距和滚动
        }}
        selectedKey={activeTab}
        variant="underlined"
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.key}
            data-key={tab.key}
            title={
              <div className="flex items-center space-x-2">
                <span>{tab.title}</span>
                {tab.closable && (
                  <div
                    aria-label="关闭标签页"
                    className="hover:bg-default-100 rounded-full cursor-pointer flex items-center justify-center"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(tab.key);
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      handleKeyDown(e, () => handleCloseTab(tab.key));
                    }}
                  >
                    <Icon icon="line-md:close" width={16} />
                  </div>
                )}
              </div>
            }
          >
            <div className="h-full overflow-auto">
              {tab.content}
            </div>
          </Tab>
        ))}
        <Tab
          key="add"
          title={
            <div
              aria-label="添加新标签页"
              className="cursor-pointer py-3 pr-2"
              role="button"
              tabIndex={0}
              onClick={handleAddTab}
              onKeyDown={(e) => handleKeyDown(e, handleAddTab)}
            >
              <Icon icon="mi:add" width={24} />
            </div>
          }
        />
      </Tabs>
    </div>
  );
};

export default DynamicTabs;

