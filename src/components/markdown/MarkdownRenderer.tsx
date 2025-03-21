import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/react";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { useTheme } from "next-themes";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import toast from "@/utils/toast";

// Markdown渲染器组件接口
interface MarkdownRendererProps {
  content: string;
  className?: string;
  onCopy?: () => void;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
  onCopy,
}) => {
  // 正确使用钩子 - 始终在组件顶层无条件调用
  const { theme } = useTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("已复制内容");
    onCopy?.();
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center px-3 py-2.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-blue-50/80 dark:from-neutral-800/80 backdrop-blur-sm border-b border-blue-100 dark:border-neutral-800">
        <div className="flex items-center space-x-2.5">
          <Icon
            className="text-indigo-600 dark:text-indigo-400"
            icon="ri:markdown-fill"
            width={20}
          />
          <span className="text-sm font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Markdown预览
          </span>
        </div>
        <div className="flex space-x-1.5">
          <Button
            isIconOnly
            className="bg-blue-50 text-indigo-500 hover:text-indigo-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-blue-800/40 rounded-full"
            size="sm"
            title="复制内容"
            variant="flat"
            onPress={handleCopy}
          >
            <Icon icon="lucide:copy" width={16} />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "flex-1 overflow-auto p-4 prose prose-sm dark:prose-invert max-w-none",
          "prose-headings:my-3 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
          "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
          "prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0",
          "prose-code:text-blue-600 prose-code:dark:text-blue-400 prose-code:bg-blue-50 prose-code:dark:bg-blue-900/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md",
          className,
        )}
      >
        <ReactMarkdown
          components={{
            code({  className, children }) {
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "";

              // 确保children是字符串
              const content = String(children).replace(/\n$/, "");

              return (
                <div className="rounded-md overflow-hidden my-3">
                  <div className="flex items-center justify-between px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <span>{language || "text"}</span>
                    <Button
                      isIconOnly
                      className="h-5 w-5 min-w-5 bg-transparent hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full"
                      size="sm"
                      title="复制代码"
                      variant="flat"
                      onPress={() => {
                        navigator.clipboard.writeText(content);
                        toast.success("已复制代码");
                      }}
                    >
                      <Icon icon="lucide:copy" width={12} />
                    </Button>
                  </div>
                  <SyntaxHighlighter
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      borderRadius: "0 0 6px 6px",
                      fontSize: "0.85rem",
                    }}
                    language={language || "text"}
                    showLineNumbers={true}
                    style={theme === "dark" ? vscDarkPlus : vs}
                    wrapLines={true}
                  >
                    {content}
                  </SyntaxHighlighter>
                </div>
              );
            },
            // @ts-ignore - 忽略类型检查错误
            table({ node, ...props }) {
              return (
                <div className="overflow-x-auto">
                  <table
                    className="border-collapse border border-gray-300 dark:border-gray-700"
                    {...props}
                  />
                </div>
              );
            },
            // @ts-ignore - 忽略类型检查错误
            th({ node, ...props }) {
              return (
                <th
                  className="border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800"
                  {...props}
                />
              );
            },
            // @ts-ignore - 忽略类型检查错误
            td({ node, ...props }) {
              return (
                <td
                  className="border border-gray-300 dark:border-gray-700 px-4 py-2"
                  {...props}
                />
              );
            },
          }}
          remarkPlugins={[remarkGfm]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownRenderer;
