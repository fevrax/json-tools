"use client";

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { cn, Skeleton } from "@nextui-org/react";

import { useTabStore } from "@/store/useTabStore";
import DynamicTabs, {
  DynamicTabsRef,
} from "@/components/dynamicTabs/dynamicTabs";
import {
  MonacoJsonEditorRef,
  MonacoJsonEditorProps,
} from "@/components/monacoEditor/monacoJsonEditor";
import { SidebarKeys, useSidebarStore } from "@/store/useSidebarStore";
import VanillaJsonEditor, {
  VanillaJsonEditorRef,
} from "@/components/vanillaJsonEditor/vanillaJsonEditor";

import "vanilla-jsoneditor-cn/themes/jse-theme-dark.css";
import {
  MonacoDiffEditorProps,
  MonacoDiffEditorRef,
} from "@/components/monacoEditor/monacoDiffEditor";
import MonacoDiffOperationBar, {
  MonacoDiffOperationBarRef,
} from "@/components/monacoEditor/MonacoDiffOperationBar";
import MonacoOperationBar, {
  MonacoOperationBarRef,
} from "@/components/monacoEditor/monacoOperationBar";

const monacoJsonEditorRefs: Record<string, MonacoJsonEditorRef> = {};
const monacoDiffEditorRefs: Record<string, MonacoDiffEditorRef> = {};

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
  },
);

// 函数式导入，并且注入 MonacoDiffEditorRef 类型
const MonacoDiffEditorWithDynamic = dynamic(
  async () => {
    const { default: Editor } = await import(
      "@/components/monacoEditor/monacoDiffEditor"
    );

    const MonacoDiffEditor: React.FC<MonacoDiffEditorProps> = (props) => (
      <Editor
        ref={(ref) => {
          if (ref) {
            monacoDiffEditorRefs[props.tabKey] = ref;
          }
        }}
        {...props}
      />
    );

    MonacoDiffEditor.displayName = "MonacoDiffEditorWithDynamic";

    return MonacoDiffEditor;
  },
  {
    ssr: false,
  },
);

export default function Home() {
  const { theme } = useTheme();
  const {
    tabs,
    activeTabKey,
    syncStore,
    setTabContent,
    setTabVanillaContent,
    setTabVanillaMode,
    vanilla2JsonContent,
    jsonContent2VanillaContent,
  } = useTabStore();
  const sidebarStore = useSidebarStore();
  const tabRef = useRef<DynamicTabsRef>(null);
  const monacoOperationBarRef = useRef<MonacoOperationBarRef>(null);
  const monacoDiffOperationBarRef = useRef<MonacoDiffOperationBarRef>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState<number>(0);
  const vanillaJsonEditorRefs = useRef<Record<string, VanillaJsonEditorRef>>(
    {},
  );

  const [monacoDiffEditorLoaded, setMonacoDiffEditorLoaded] = useState(false);
  const [monacoEditorLoaded, setMonacoEditorLoaded] = useState(false);

  // 计算高度的函数
  const calculateHeight = () => {
    if (tabRef.current) {
      const windowHeight = window.innerHeight;
      const editorContainerTop = editorContainerRef.current?.offsetTop;

      let newHeight = 0;

      if (editorContainerTop !== undefined) {
        newHeight = windowHeight - editorContainerTop - 2; // 减去一些额外的边距
      }
      setEditorHeight(newHeight); // 设置最小高度
    }
  };

  // 渲染 MonacoJsonEditor
  const renderMonacoJsonEditor = () => {
    return (
      <>
        <MonacoOperationBar
          ref={monacoOperationBarRef}
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
        <Skeleton
          className="rounded-md"
          isLoaded={monacoEditorLoaded}
          style={{ height: "calc(100vh - 84px)" }}
        >
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
                  height={editorHeight - 40}
                  tabKey={tab.key}
                  theme={theme == "dark" ? "vs-dark" : "vs-light"}
                  value={tab.content}
                  onLoaded={() => setMonacoEditorLoaded(true)}
                  onUpdateValue={(value) => {
                    setTabContent(tab.key, value);
                  }}
                />
              </div>
            );
          })}
        </Skeleton>
      </>
    );
  };

  // 渲染 MonacoDiffEditor
  const renderMonacoDiffEditor = () => {
    return (
      <div className="w-full">
        <MonacoDiffOperationBar
          ref={monacoDiffOperationBarRef}
          onClear={(type) => {
            return monacoDiffEditorRefs[activeTabKey].clear(type);
          }}
          onCopy={(type) => {
            return monacoDiffEditorRefs[activeTabKey].copy(type);
          }}
          onFieldSort={(type, sort: "asc" | "desc") => {
            return monacoDiffEditorRefs[activeTabKey].fieldSort(type, sort);
          }}
          onFormat={(type) => {
            return monacoDiffEditorRefs[activeTabKey].format(type);
          }}
        />
        <Skeleton
          className="rounded-md"
          isLoaded={monacoDiffEditorLoaded}
          style={{ height: "calc(100vh - 84px)" }}
        >
          {tabs.map((tab) => {
            return (
              <div
                key={tab.key}
                className={cn("w-full h-full", {
                  hidden: tab.key !== activeTabKey,
                })}
              >
                <MonacoDiffEditorWithDynamic
                  key={tab.key}
                  height={editorHeight - 45}
                  modifiedValue=""
                  originalValue={tab.content}
                  tabKey={tab.key}
                  theme={theme == "dark" ? "vs-dark" : "vs-light"}
                  onLoaded={() => setMonacoDiffEditorLoaded(true)}
                  onUpdateOriginalValue={(value) => {
                    setTabContent(tab.key, value);
                  }}
                />
              </div>
            );
          })}
        </Skeleton>
      </div>
    );
  };
  // 渲染 renderVanillaJsonEditor
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
                  theme == "dark" ||
                  window.localStorage.getItem("theme") == "dark",
              })}
            >
              <VanillaJsonEditor
                key={tab.key}
                ref={(ref) => {
                  if (ref) {
                    vanillaJsonEditorRefs.current[tab.key] = ref;
                  }
                }}
                content={tab.vanilla}
                height={editorHeight}
                mode={tab.vanillaMode}
                tabKey={tab.key}
                onChangeMode={(mode) => {
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
        return renderMonacoDiffEditor();
      default:
        return <div>404</div>;
    }
  };

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    syncStore();

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
    switch (sidebarStore.clickSwitchKey) {
      case SidebarKeys.textView:
        // 如果切换之前是 diff 视图着不需要处理
        if (sidebarStore.activeKey == SidebarKeys.diffView) {
          break;
        }
        vanilla2JsonContent();
        break;
      case SidebarKeys.diffView:
        // 如果切换之前是 text 视图着不需要处理
        if (sidebarStore.activeKey == SidebarKeys.textView) {
          break;
        }
        vanilla2JsonContent();
        break;
      case SidebarKeys.treeView:
        jsonContent2VanillaContent();
        break;
    }
    sidebarStore.switchActiveKey();
  }, [sidebarStore.clickSwitchKey]);

  return (
    <div className="dark:bg-vscode-dark h-full">
      {/*<DynamicTabs ref={tabRef} />*/}
      {/*<div ref={editorContainerRef}>{renderEditor()}</div>*/}
    </div>
  );
}
