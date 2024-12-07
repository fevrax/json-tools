"use client"; // 必须添加

import React, { useRef, useState, useEffect, forwardRef } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
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

const monacoJsonEditorRefs: Record<string, MonacoJsonEditorRef> = {};

// 函数式导入，并且注入 MonacoJsonEditorRef 类型
const MonacoJsonEditorWithDynamic = dynamic(
  async () => {
    const { default: Editor } = await import(
      "@/components/monacoEditor/monacoJsonEditor"
    );
    const monacoJsonEditor = forwardRef<
      MonacoJsonEditorRef,
      MonacoJsonEditorProps
    >((props, ref) => (
      <Editor
        ref={(ref) => {
          if (ref) {
            monacoJsonEditorRefs[props.tabKey] = ref;
          }
        }}
        {...props}
      />
    ));

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
  const { tabs, activeTabKey, activeTab, getTabByKey, setTabContent } = useTabStore();
  const sidebarStore = useSidebarStore();
  const tabRef = useRef<DynamicTabsRef>(null);
  const [editorHeight, setEditorHeight] = useState<number>(300);

  const [editorElements, setEditorElements] = useState<
    Record<string, React.ReactNode>
  >({});

  // 计算高度的函数
  const calculateHeight = () => {
    if (tabRef.current) {
      const windowHeight = window.innerHeight;
      const containerTop = tabRef.current.getPositionTop();
      const newHeight = windowHeight - containerTop - 10 - 35; // 减去一些额外的边距

      setEditorHeight(Math.max(newHeight, 300)); // 设置最小高度
    }
  };

  // 淡入淡出动画配置
  const fadeVariants = {
    hidden: {
      opacity: 0,
      // scale: 0.95, // 轻微缩放效果
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  // 渲染当前激活的 MonacoJsonEditor
  const renderActiveKeyMonacoJson = (key: string) => {
    return (
      <motion.div
        key={key}
        animate="visible"
        className={cn("w-full h-full")}
        exit="hidden"
        initial="hidden"
        variants={fadeVariants}
      >
        <MonacoJsonEditorWithDynamic
          key={key}
          height={editorHeight}
          tabKey={key}
          theme={theme == "dark" ? "vs-dark" : "vs-light"}
          value={getTabByKey(key)?.content}
          onUpdateValue={(value) => {
            setTabContent(key, value);
          }}
        />
      </motion.div>
    );
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
        <AnimatePresence mode="popLayout">
          {Object.entries(editorElements).map(([key, element]) => (
            <div key={key} className={cn({ hidden: key !== activeTabKey })}>
              {element}
            </div>
          ))}
        </AnimatePresence>
      </>
    );
  };

  // 通过菜单栏的 activeKey 渲染编辑器
  const renderEditor = () => {
    switch (sidebarStore.activeKey) {
      case SidebarKeys.textView:
        return renderMonacoJsonEditor();
      case SidebarKeys.treeView:
        return <div>treeView</div>;
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
    // 懒加载 MonacoJsonEditor
    if (!editorElements[activeTabKey]) {
      setEditorElements((prev) => ({
        ...prev,
        [activeTabKey]: renderActiveKeyMonacoJson(activeTabKey),
      }));
    }
    if (activeTabKey && monacoJsonEditorRefs[activeTabKey]) {
      monacoJsonEditorRefs[activeTabKey].layout();
      monacoJsonEditorRefs[activeTabKey].focus();
    }
  }, [activeTabKey]);

  return (
    <div className="dark:bg-vscode-dark">
      <DynamicTabs ref={tabRef} />
      {renderEditor()}
    </div>
  );
}
