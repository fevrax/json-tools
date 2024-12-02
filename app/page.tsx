"use client"; // 必须添加

import { cn } from "@nextui-org/react";
import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";

import { TabItem, useTabStore } from "@/store/useTabStore";
import DynamicTabs, {
  DynamicTabsRef,
} from "@/components/dynamicTabs/dynamicTabs";

// export const dynamic = "force-static";

const MonacoJsonEditorWithNoSSR = dynamic(
  () => import("../components/MonacoEditor/monacoJsonEditor"),
  { ssr: false },
);

export default function Home() {
  const { tabs, activeTabKey } = useTabStore();
  const tabRef = useRef<DynamicTabsRef>(null);
  const [editorHeight, setEditorHeight] = useState<number>(500);
  // 计算高度的函数
  const calculateHeight = () => {
    if (tabRef.current) {
      const windowHeight = window.innerHeight;
      const containerTop = tabRef.current.getPositionTop();
      const newHeight = windowHeight - containerTop - 5; // 减去一些额外的边距

      setEditorHeight(Math.max(newHeight, 300)); // 设置最小高度
    }
  };

  useEffect(() => {
    console.log(process.env.NODE_ENV);
    calculateHeight();
    window.addEventListener("resize", calculateHeight);

    return () => {
      window.removeEventListener("resize", calculateHeight);
    };
  }, []);

  return (
    <>
      <DynamicTabs ref={tabRef} />
      {tabs.map((tab: TabItem) => {
        return (
          <div
            key={tab.key}
            className={cn({ hidden: activeTabKey !== tab.key })}
          >
            <MonacoJsonEditorWithNoSSR key={tab.key} height={editorHeight} />
          </div>
        );
      })}
    </>
  );
}
