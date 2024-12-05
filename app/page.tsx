"use client"; // 必须添加

import React, { useRef, useState, useEffect, forwardRef } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@nextui-org/react";

import { TabItem, useTabStore } from "@/store/useTabStore";
import DynamicTabs, {
  DynamicTabsRef,
} from "@/components/dynamicTabs/dynamicTabs";
import {
  MonacoJsonEditorRef,
  MonacoJsonEditorProps,
} from "@/components/monacoEditor/monacoJsonEditor";
import MonacoOperationBar from "@/components/monacoEditor/operationBar";

const monaceJsonEditorRefs: Record<string, MonacoJsonEditorRef> = {};

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
            monaceJsonEditorRefs[props.tabKey] = ref;
          }
        }}
        {...props}
      />
    ));

    monacoJsonEditor.displayName = "MonacoJsonEditorWithDynamic";

    return monacoJsonEditor;
  },
  { ssr: false },
);

export default function Home() {
  const { theme, setTheme } = useTheme();
  const { tabs, activeTabKey } = useTabStore();
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

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);

    return () => {
      window.removeEventListener("resize", calculateHeight);
    };
  }, []);

  useEffect(() => {
    if (activeTabKey && monaceJsonEditorRefs[activeTabKey]) {
      monaceJsonEditorRefs[activeTabKey].focus();
    }
  }, [activeTabKey]);

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

  return (
    <div className="dark:bg-vscode-dark">
      <DynamicTabs ref={tabRef} />
      <MonacoOperationBar />
      <AnimatePresence mode="popLayout">
        {tabs.map((tab: TabItem, index: number) => (
          <motion.div
            key={tab.key}
            animate="visible"
            className={cn("w-full h-full", {
              hidden: tab.key !== activeTabKey,
            })}
            exit="hidden"
            initial="hidden"
            variants={fadeVariants}
          >
            <MonacoJsonEditorWithDynamic
              key={tab.key}
              height={editorHeight}
              tabKey={tab.key}
              theme={theme == "dark" ? "vs-dark" : "vs-light"}
              value={tab.content}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
