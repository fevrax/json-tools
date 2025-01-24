import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { cn } from "@heroui/react";
import { useTheme } from "next-themes";
import { Content } from "vanilla-jsoneditor-cn";

import { useTabStore } from "@/store/useTabStore";
import DynamicTabs, {
  DynamicTabsRef,
} from "@/components/dynamicTabs/dynamicTabs";
import MonacoJsonEditor, {
  MonacoJsonEditorRef,
} from "@/components/monacoEditor/monacoJsonEditor";
import { SidebarKeys, useSidebarStore } from "@/store/useSidebarStore";
// eslint-disable-next-line import/order
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

import "@/styles/index.css";

export default function IndexPage() {
  const { theme } = useTheme();
  const monacoJsonEditorRefs = useRef<Record<string, MonacoJsonEditorRef>>({});
  const monacoDiffEditorRefs = useRef<Record<string, MonacoDiffEditorRef>>({});
  const vanillaJsonEditorRefs = useRef<Record<string, VanillaJsonEditorRef>>(
    {},
  );

  const {
    tabs,
    activeTabKey,
    activeTab,
    addTab,
    setTabContent,
    syncTabStore,
    setTabVanillaContent,
    setTabVanillaMode,
    vanilla2JsonContent,
    setMonacoVersion,
    setVanillaVersion,
    jsonContent2VanillaContent,
  } = useTabStore();

  const sidebarStore = useSidebarStore();
  const tabRef = useRef<DynamicTabsRef>(null);
  const monacoOperationBarRef = useRef<MonacoOperationBarRef>(null);
  const monacoDiffOperationBarRef = useRef<MonacoDiffOperationBarRef>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState<number>(0);

  const monacoUpdateContentTimeoutId = useRef<Record<string, NodeJS.Timeout>>(
    {},
  );
  const vanillaUpdateContentTimeoutId = useRef<Record<string, NodeJS.Timeout>>(
    {},
  );

  // 使用Map来分别存储每种编辑器类型的加载状态
  const [loadedEditors, setLoadedEditors] = useState<{
    monaco: Set<string>;
    diff: Set<string>;
    vanilla: Set<string>;
  }>({
    monaco: new Set(),
    diff: new Set(),
    vanilla: new Set(),
  });

  // 计算高度的函数
  const calculateHeight = () => {
    if (tabRef.current) {
      const windowHeight = window.innerHeight;
      const editorContainerTop = editorContainerRef.current?.offsetTop;

      let newHeight = 0;

      if (editorContainerTop !== undefined) {
        newHeight = windowHeight - editorContainerTop - 2; // 可根据需要微调
      }
      setEditorHeight(newHeight); // 设置最小高度
    }
  };

  // MonacoJsonEditor 更新内容后同步
  const monacoEditorUpdateContent = (key: string, content: string) => {
    clearTimeout(monacoUpdateContentTimeoutId.current[key]);
    monacoUpdateContentTimeoutId.current[key] = setTimeout(() => {
      setTabContent(key, content);
    }, 800);
  };

  // VanillaJsonEditor 更新内容后同步
  const vanillaEditorUpdateContent = (key: string, content: Content) => {
    clearTimeout(vanillaUpdateContentTimeoutId.current[key]);
    vanillaUpdateContentTimeoutId.current[key] = setTimeout(() => {
      setTabVanillaContent(key, content);
    }, 1500);
  };

  const [editorLoading, setEditorLoading] = useState<{
    [key: string]: boolean;
  }>({});

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
        <div className="editor-container">
          {tabs.map((tab) => {
            // 如果已加载过该 tab，或者该 tab 恰好为当前激活 tab，则渲染
            const shouldRender = loadedEditors.monaco.has(tab.key);
            const isVisible = tab.key === activeTabKey;

            // 如果当前 tab 未加载且正是 activeTab，则将其加入 loaded 集合
            if (!shouldRender && isVisible) {
              setLoadedEditors((prev) => ({
                ...prev,
                monaco: new Set([...prev.monaco, tab.key]),
              }));
            }

            // 保持一个包裹容器常驻 DOM
            // 如果 shouldRender 为 true 才真正挂载编辑器，否则空占位
            return (
              <div
                key={tab.key}
                className={cn(
                  "editor-wrapper",
                  "editor-transition",
                  isVisible && "visible",
                  !editorLoading[tab.key] && "loaded",
                )}
              >
                {shouldRender && (
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
                    onMount={() => {
                      setEditorLoading((prev) => ({
                        ...prev,
                        [tab.key]: false,
                      }));
                    }}
                    onUpdateValue={(value) => {
                      monacoEditorUpdateContent(tab.key, value);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // MonacoDiffEditor 渲染函数
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
        <div className="editor-container">
          {tabs.map((tab) => {
            const shouldRender = loadedEditors.diff.has(tab.key);
            const isVisible = tab.key === activeTabKey;

            if (!shouldRender && isVisible) {
              setLoadedEditors((prev) => ({
                ...prev,
                diff: new Set([...prev.diff, tab.key]),
              }));
            }

            return (
              <div
                key={tab.key}
                className={cn(
                  "editor-wrapper",
                  "editor-transition",
                  isVisible && "visible",
                  !editorLoading[tab.key] && "loaded",
                )}
              >
                {shouldRender && (
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
                    onMount={() => {
                      setEditorLoading((prev) => ({
                        ...prev,
                        [tab.key]: false,
                      }));
                    }}
                    onUpdateOriginalValue={(value) => {
                      monacoEditorUpdateContent(tab.key, value);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // vanillaJsonEditor 渲染函数
  const renderVanillaJsonEditor = () => {
    return (
      <div className="editor-container">
        {tabs.map((tab) => {
          const shouldRender = loadedEditors.vanilla.has(tab.key);
          const isVisible = tab.key === activeTabKey;

          if (!shouldRender && isVisible) {
            setLoadedEditors((prev) => ({
              ...prev,
              vanilla: new Set([...prev.vanilla, tab.key]),
            }));
          }

          return (
            <div
              key={"vanilla-" + tab.key}
              className={cn(
                "w-full h-full",
                isVisible && "visible",
                !editorLoading[tab.key] && "loaded",
                {
                  hidden: tab.key !== activeTabKey,
                  "jse-theme-dark": theme === "dark",
                },
              )}
            >
              {shouldRender && (
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
                  onMount={() => {
                    setEditorLoading((prev) => ({
                      ...prev,
                      [tab.key]: false,
                    }));
                  }}
                  onUpdateValue={(content) => {
                    vanillaEditorUpdateContent(tab.key, content);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
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

  const tabSwitchHandle = () => {
    const currentTab = activeTab();

    // 如果当前 tab 存在 monaco 版本和 vanilla 版本不一致, 则需要同步数据
    if (currentTab && currentTab.monacoVersion != currentTab.vanillaVersion) {
      switch (sidebarStore.clickSwitchKey) {
        case SidebarKeys.textView:
          // 如果切换之前是 diff 视图着不需要处理
          if (sidebarStore.activeKey == SidebarKeys.diffView) {
            break;
          }
          // 如果vanillaVersion < monacoVersion 则需要不同步数据
          if (currentTab.vanillaVersion < currentTab.monacoVersion) {
            break;
          }
          vanilla2JsonContent(activeTabKey);
          setMonacoVersion(activeTabKey, currentTab.vanillaVersion);
          // 强制更新 monaco 编辑器内容
          monacoJsonEditorRefs.current[currentTab.key].updateValue(
            activeTab().content,
          );
          break;
        case SidebarKeys.diffView:
          // 如果切换之前是 text 视图着不需要处理
          if (sidebarStore.activeKey == SidebarKeys.textView) {
            break;
          }
          // 如果vanillaVersion < monacoVersion 则需要不同步数据
          if (currentTab.vanillaVersion < currentTab.monacoVersion) {
            break;
          }
          vanilla2JsonContent(activeTabKey);
          setMonacoVersion(activeTabKey, currentTab.vanillaVersion);
          monacoDiffEditorRefs.current[currentTab.key]?.updateOriginalValue(
            activeTab().content,
          );
          break;
        case SidebarKeys.treeView:
          // 如果vanillaVersion < monacoVersion 则需要不同步数据
          if (currentTab.monacoVersion < currentTab.vanillaVersion) {
            break;
          }
          jsonContent2VanillaContent(activeTabKey);
          setVanillaVersion(activeTabKey, currentTab.monacoVersion);
          const tempTab = activeTab();

          if (tempTab && tempTab.vanilla) {
            vanillaJsonEditorRefs.current[
              tempTab.key
            ]?.updateEditorContentAndMode(tempTab.vanillaMode, tempTab.vanilla);
          }
          break;
      }
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
    // 在切换标签时预加载下一个编辑器
    if (activeTabKey) {
      // 设置新标签页的加载状态
      setEditorLoading((prev) => ({
        ...prev,
        [activeTabKey]: true,
      }));

      // 预加载相邻的标签页
      const currentIndex = tabs.findIndex((tab) => tab.key === activeTabKey);
      const preloadIndexes = [currentIndex - 1, currentIndex + 1].filter(
        (index) => index >= 0 && index < tabs.length,
      );

      preloadIndexes.forEach((index) => {
        const tab = tabs[index];

        if (!tab) {
          return;
        }

        switch (sidebarStore.activeKey) {
          case SidebarKeys.textView:
            setLoadedEditors((prev) => ({
              ...prev,
              monaco: new Set([...prev.monaco, tab.key]),
            }));
            break;
          case SidebarKeys.treeView:
            setLoadedEditors((prev) => ({
              ...prev,
              vanilla: new Set([...prev.vanilla, tab.key]),
            }));
            break;
          case SidebarKeys.diffView:
            setLoadedEditors((prev) => ({
              ...prev,
              diff: new Set([...prev.diff, tab.key]),
            }));
            break;
        }
      });
    }

    // 焦点切换到当前激活的 tab
    if (activeTabKey && monacoJsonEditorRefs.current[activeTabKey]) {
      monacoJsonEditorRefs.current[activeTabKey].layout();
      monacoJsonEditorRefs.current[activeTabKey].focus();
    }
  }, [activeTabKey]);

  // 切换视图时同步数据
  useEffect(() => {
    tabSwitchHandle();
    sidebarStore.switchActiveKey();
  }, [sidebarStore.clickSwitchKey]);

  return (
    <div className="dark:bg-vscode-dark h-full">
      <DynamicTabs ref={tabRef} onSwitch={tabSwitchHandle} />
      <div ref={editorContainerRef}>{renderEditor()}</div>
    </div>
  );
}
