import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { cn } from "@heroui/react";
import { useTheme } from "next-themes";

import { useTabStore } from "@/store/useTabStore";
import DynamicTabs, {
  DynamicTabsRef,
} from "@/components/dynamicTabs/dynamicTabs";
import MonacoJsonEditor, {
  MonacoJsonEditorRef,
} from "@/components/monacoEditor/monacoJsonEditor";
import { SidebarKeys, useSidebarStore } from "@/store/useSidebarStore";
import VanillaJsonEditor, {
  VanillaJsonEditorRef,
} from "@/components/vanillaJsonEditor/vanillaJsonEditor";

import "vanilla-jsoneditor-cn/themes/jse-theme-dark.css";
import MonacoDiffEditor, {
  MonacoDiffEditorRef,
} from "@/components/monacoEditor/monacoDiffEditor";
import MonacoDiffOperationBar, {
  MonacoDiffOperationBarRef,
} from "@/components/monacoEditor/MonacoDiffOperationBar";
import MonacoOperationBar, {
  MonacoOperationBarRef,
} from "@/components/monacoEditor/monacoOperationBar";
import { SettingsState } from "@/store/useSettingsStore";
import { storage } from "@/lib/indexedDBStore";

export default function IndexPage() {
  const { theme } = useTheme();
  const monacoJsonEditorRefs = useRef<Record<string, MonacoJsonEditorRef>>({});
  const monacoDiffEditorRefs = useRef<Record<string, MonacoDiffEditorRef>>({});

  const {
    tabs,
    activeTabKey,
    addTab,
    setTabContent,
    syncTabStore,
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
            return monacoJsonEditorRefs.current[activeTabKey].clear();
          }}
          onCopy={(type) => {
            return monacoJsonEditorRefs.current[activeTabKey].copy(type);
          }}
          onFieldSort={(type) => {
            return monacoJsonEditorRefs.current[activeTabKey].fieldSort(type);
          }}
          onFormat={() => {
            return monacoJsonEditorRefs.current[activeTabKey].format();
          }}
          onMore={(key) => {
            return monacoJsonEditorRefs.current[activeTabKey].moreAction(key);
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
              <MonacoJsonEditor
                key={tab.key}
                ref={(ref) => {
                  if (ref) {
                    monacoJsonEditorRefs.current[tab.key] = ref;
                  }
                }}
                height={editorHeight - 40}
                tabKey={tab.key}
                theme={theme === "dark" ? "vs-dark" : "vs-light"}
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

  // 渲染 MonacoDiffEditor
  const renderMonacoDiffEditor = () => {
    return (
      <div className="w-full">
        <MonacoDiffOperationBar
          ref={monacoDiffOperationBarRef}
          onClear={(type) => {
            return monacoDiffEditorRefs.current[activeTabKey].clear(type);
          }}
          onCopy={(type) => {
            return monacoDiffEditorRefs.current[activeTabKey].copy(type);
          }}
          onFieldSort={(type, sort: "asc" | "desc") => {
            return monacoDiffEditorRefs.current[activeTabKey].fieldSort(
              type,
              sort,
            );
          }}
          onFormat={(type) => {
            return monacoDiffEditorRefs.current[activeTabKey].format(type);
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
              <MonacoDiffEditor
                key={tab.key}
                ref={(ref) => {
                  if (ref) {
                    monacoDiffEditorRefs.current[tab.key] = ref;
                  }
                }}
                height={editorHeight - 42}
                modifiedValue=""
                originalValue={tab.content}
                tabKey={tab.key}
                theme={theme === "dark" ? "vs-dark" : "vs-light"}
                onUpdateOriginalValue={(value) => {
                  setTabContent(tab.key, value);
                }}
              />
            </div>
          );
        })}
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
                "jse-theme-dark": theme === "dark",
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

  useLayoutEffect(() => {
    calculateHeight();

    window.addEventListener("resize", calculateHeight);

    const init = async () => {
      const settings = await storage.getItem<SettingsState>("settings");

      if (settings?.editDataSaveLocal) {
        await syncTabStore();
      }

      if ((window as any).utools) {
        (window as any).utools.onPluginEnter((data: any) => {
          if (data.type === "regex") {
            addTab(undefined, data.payload);
          }
        });
      }
    };

    init();

    return () => {
      window.removeEventListener("resize", calculateHeight);
    };
  }, []);

  useEffect(() => {
    if (activeTabKey && monacoJsonEditorRefs.current[activeTabKey]) {
      monacoJsonEditorRefs.current[activeTabKey].layout();
      monacoJsonEditorRefs.current[activeTabKey].focus();
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
      <DynamicTabs ref={tabRef} />
      <div ref={editorContainerRef}>{renderEditor()}</div>
    </div>
  );
}
