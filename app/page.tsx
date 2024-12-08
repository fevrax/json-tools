"use client"; // 必须添加

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { cn } from "@nextui-org/react";

import { useTabStore } from "@/store/useTabStore";
import DynamicTabs, {
  DynamicTabsRef,
} from "@/components/dynamicTabs/dynamicTabs";
import {
  MonacoJsonEditorRef,
  MonacoJsonEditorProps,
} from "@/components/monacoEditor/monacoJsonEditor";
import MonacoOperationBar from "@/components/monacoEditor/operationBar";
import { SidebarKeys, useSidebarStore } from "@/store/useSidebarStore";
import VanillaJsonEditor from "@/components/vanillaJsonEditor/vanillaJsonEditor";

import "vanilla-jsoneditor-cn/themes/jse-theme-dark.css";

const monacoJsonEditorRefs: Record<string, MonacoJsonEditorRef> = {};

// 函数式导入，并且注入 MonacoJsonEditorRef 类型
const MonacoJsonEditorWithDynamic = dynamic(
  async () => {
    const { default: Editor } = await import(
      "@/components/monacoEditor/monacoJsonEditor"
    );

    const monacoJsonEditor: React.FC<MonacoJsonEditorProps> = (props) => (
      <Editor
        ref={(ref) => {
          if (ref) {
            monacoJsonEditorRefs[props.tabKey] = ref;
          }
        }}
        {...props}
      />
    );

    monacoJsonEditor.displayName = "MonacoJsonEditorWithDynamic";

    return monacoJsonEditor;
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        Loading editor...
      </div>
    ),
  },
);

export default function Home() {
  const { theme } = useTheme();
  const { tabs, activeTabKey, activeTab, getTabByKey, setTabContent,setTabVanillaContent,setTabVanillaMode,vanilla2JsonContent, jsonContent2VanillaContent } =
    useTabStore();
  const sidebarStore = useSidebarStore();
  const tabRef = useRef<DynamicTabsRef>(null);
  const [editorHeight, setEditorHeight] = useState<number>(300);

  // 计算高度的函数
  const calculateHeight = () => {
    if (tabRef.current) {
      const windowHeight = window.innerHeight;
      const containerTop = tabRef.current.getPositionTop();
      const newHeight = windowHeight - containerTop - 10 - 35; // 减去一些额外的边距

      setEditorHeight(Math.max(newHeight, 300)); // 设置最小高度
    }
  };

  // 渲染 MonacoJsonEditor
  const renderMonacoJsonEditor = () => {
    return (
      <>
        <MonacoOperationBar
          onClear={() => {
            return monacoJsonEditorRefs[activeTabKey].clear();
          }}
          onCopy={(type) => {
            return monacoJsonEditorRefs[activeTabKey].copy(type);
          }}
          onFieldSort={(type) => {
            return monacoJsonEditorRefs[activeTabKey].fieldSort(type);
          }}
          onFormat={() => {
            return monacoJsonEditorRefs[activeTabKey].format();
          }}
          onMore={(key) => {
            return monacoJsonEditorRefs[activeTabKey].moreAction(key);
          }}
        />
        {tabs.map((tab) => {
          return (
            <div
              key={tab.key}
              className={cn("w-full h-full", {
                hidden: tab.key !== activeTabKey,
              })}
            >
              <MonacoJsonEditorWithDynamic
                key={tab.key}
                height={editorHeight}
                tabKey={tab.key}
                theme={theme == "dark" ? "vs-dark" : "vs-light"}
                value={tab.content}
                onUpdateValue={(value) => {
                  setTabContent(tab.key, value);
                }}
              />
            </div>
          );
        })}
      </>
    );
  };
  // 渲染 MonacoJsonEditor
  const renderVanillaJsonEditor = () => {
    return (
      <>
        {tabs.map((tab) => {
          return (
            <div
              key={"vanilla-" + tab.key}
              className={cn("w-full h-full", {
                hidden: tab.key !== activeTabKey,
                // localStorage.getItem("theme") == "dark" 解决首屏频闪导致的主题切换闪烁问题
                "jse-theme-dark":
                  theme == "dark" || localStorage.getItem("theme") == "dark",
              })}
            >
              <VanillaJsonEditor
                key={tab.key}
                content={tab.vanilla}
                height={editorHeight}
                mode={tab.vanillaMode}
                tabKey={tab.key}
                onChangeMode={(mode) => {
                  console.log("change mode", mode);
                  setTabVanillaMode(tab.key, mode);
                }}
                onUpdateValue={(content) => {
                  setTabVanillaContent(tab.key, content);
                }}
              />
            </div>
          );
        })}
      </>
    );
  };

  // 通过菜单栏的 activeKey 渲染编辑器
  const renderEditor = () => {
    switch (sidebarStore.activeKey) {
      case SidebarKeys.textView:
        return renderMonacoJsonEditor();
      case SidebarKeys.treeView:
        return renderVanillaJsonEditor();
      case SidebarKeys.diffView:
        return <div>diffView</div>;
      default:
        return <div>404</div>;
    }
  };

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);

    return () => {
      window.removeEventListener("resize", calculateHeight);
    };
  }, []);

  useEffect(() => {
    if (activeTabKey && monacoJsonEditorRefs[activeTabKey]) {
      monacoJsonEditorRefs[activeTabKey].layout();
      monacoJsonEditorRefs[activeTabKey].focus();
    }
  }, [activeTabKey]);

  useEffect(() => {
    console.log("clickSwitchKey", sidebarStore.clickSwitchKey);
    switch (sidebarStore.activeKey) {
      case SidebarKeys.textView:
        vanilla2JsonContent();
        break;
      case SidebarKeys.treeView:
        jsonContent2VanillaContent();
        // TODO 切换后需要更新编辑器中的内容
        break;
    }
  },[sidebarStore.clickSwitchKey])

  return (
    <div className="dark:bg-vscode-dark">
      <DynamicTabs ref={tabRef} />
      {renderEditor()}
    </div>
  );
}
