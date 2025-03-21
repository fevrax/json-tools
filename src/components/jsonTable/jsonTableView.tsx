import React, { useCallback, useRef, useState, useEffect } from "react";

import JsonTableOperationBar, {
  JsonTableOperationBarRef,
} from "./jsonTableOperationBar";
import JsonTable from "./jsonTable";

import toast from "@/utils/toast";
import clipboard from "@/utils/clipboard";

// 不再需要自定义的通知样式
const globalStyles = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  .json-empty-float {
    animation: float 6s ease-in-out infinite;
  }
  
  .json-shimmer-effect {
    background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.2), rgba(255,255,255,0));
    background-size: 1000px 100%;
    animation: shimmer 3s infinite linear;
  }
`;

interface JsonTableViewProps {
  data: string;
  onCopy: (type?: "default" | "compress" | "escape") => boolean;
  onExport: (type: "csv" | "excel") => boolean;
  onDataUpdate?: (data: string) => void;
}

const JsonTableView: React.FC<JsonTableViewProps> = ({
  data,
  onCopy,
  onExport,
  onDataUpdate,
}) => {
  const operationBarRef = useRef<JsonTableOperationBarRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [hideEmpty, setHideEmpty] = useState(false);
  const [hideNull, setHideNull] = useState(false);
  const [jsonData, setJsonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPasting, setIsPasting] = useState(false);

  // 添加键盘事件监听和粘贴处理
  useEffect(() => {
    // 共享的粘贴处理逻辑
    const handlePasteAction = async () => {
      try {
        setIsPasting(true);

        // 使用剪贴板工具读取内容
        let text;

        // 优先使用内置函数，如果不支持则使用新的剪贴板工具
        if (clipboard.isSupported()) {
          text = await navigator.clipboard.readText();
        } else {
          text = await clipboard.read(
            "无法读取剪贴板内容, 请从文本编辑器中粘贴。",
          );
        }

        if (!text) {
          setIsPasting(false);

          return;
        }

        // 验证是否为有效JSON
        JSON.parse(text);

        // 如果提供了onDataUpdate回调，则更新数据
        if (onDataUpdate) {
          onDataUpdate(text);
          // 使用toast通知系统
          toast.success("JSON数据已成功粘贴！");
        }
      } catch (err) {
        // 使用toast显示错误信息
        toast.error(`无效的JSON数据：${(err as Error).message}`);
      } finally {
        setIsPasting(false);
      }
    };


    // 设置窗口级别的键盘事件监听
    const handleKeyDown = (e: KeyboardEvent) => {
      // 监听 Ctrl+V
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        // 阻止默认行为，确保我们的处理器能够处理粘贴事件
        if (!clipboard.isSupported()) {
          // 仅当需要自定义处理时才阻止默认行为
          e.preventDefault();
        }
        handlePasteAction();
      }
    };

    // 暴露给组件其他部分的粘贴函数
    (window as any).__jsonTablePasteHandler = handlePasteAction;

    // 添加事件监听
    window.addEventListener("keydown", handleKeyDown);

    // 清理函数
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      delete (window as any).__jsonTablePasteHandler;
    };
  }, [onDataUpdate]);

  // 尝试解析JSON字符串
  React.useEffect(() => {
    if (!data || data.trim() === "") {
      setJsonData(null);
      setError(null);

      return;
    }

    try {
      const parsed = JSON.parse(data);

      setJsonData(parsed);
      setError(null);
    } catch (err) {
      setJsonData(null);
      setError((err as Error).message || "JSON解析错误");
    }
  }, [data]);

  // 处理路径展开/折叠
  const handleToggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);

      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }

      return next;
    });
  }, []);

  // 处理用户粘贴按钮点击
  const handlePaste = useCallback(() => {
    // 使用之前定义的处理函数
    const pasteHandler = (window as any).__jsonTablePasteHandler;

    if (pasteHandler) {
      pasteHandler();
    } else {
      // 作为后备，直接模拟键盘事件
      const vEvent = new KeyboardEvent("keydown", {
        key: "v",
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(vEvent);
    }
  }, []);

  // 展开所有路径
  const handleExpandAll = useCallback(() => {
    if (!jsonData) return;

    const paths = new Set<string>();
    const traverse = (obj: any, path: string = "root") => {
      if (typeof obj === "object" && obj !== null) {
        paths.add(path);
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            traverse(item, `${path}[${index}]`);
          });
        } else {
          Object.entries(obj).forEach(([key, value]) => {
            traverse(value, `${path}.${key}`);
          });
        }
      }
    };

    traverse(jsonData);
    setExpandedPaths(paths);
  }, [jsonData]);

  // 折叠所有路径
  const handleCollapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  // 处理视图选项
  const handleCustomView = useCallback(
    (key: "hideEmpty" | "hideNull" | "showAll") => {
      switch (key) {
        case "hideEmpty":
          setHideEmpty(true);
          setHideNull(false);
          break;
        case "hideNull":
          setHideEmpty(false);
          setHideNull(true);
          break;
        case "showAll":
          setHideEmpty(false);
          setHideNull(false);
          break;
      }
    },
    [],
  );

  // 渲染空状态 - 改进现代设计感
  const renderEmptyState = () => {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-transparent via-blue-50/30 to-indigo-50/30 dark:from-transparent dark:via-blue-900/10 dark:to-indigo-900/10">
        <div className="relative max-w-2xl w-full mx-auto px-8 py-12">
          {/* 背景装饰 */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -left-20 w-96 h-96 bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-3xl" />
          </div>

          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="json-empty-float mx-auto mb-8 w-32 h-32 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl opacity-10 dark:opacity-20 blur-xl" />
              <div className="relative flex items-center justify-center w-full h-full">
                <svg
                  className="w-20 h-20 text-primary/90 drop-shadow-md"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V7H4V5Z"
                    fill="currentColor"
                    fillOpacity="0.5"
                  />
                  <path
                    d="M4 8C4 7.44772 4.44772 7 5 7H19C19.5523 7 20 7.44772 20 8V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V8Z"
                    fill="currentColor"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M7 12C7 11.4477 7.44772 11 8 11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H8C7.44772 13 7 12.5523 7 12Z"
                    fill="currentColor"
                  />
                  <path
                    d="M7 16C7 15.4477 7.44772 15 8 15H12C12.5523 15 13 15.4477 13 16C13 16.5523 12.5523 17 12 17H8C7.44772 17 7 16.5523 7 16Z"
                    fill="currentColor"
                  />
                  <path
                    clipRule="evenodd"
                    d="M4 3C2.89543 3 2 3.89543 2 5V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V5C22 3.89543 21.1046 3 20 3H4ZM20 5H4V19H20V5Z"
                    fill="currentColor"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              欢迎使用JSON表格视图
            </h3>

            <div className="space-y-4 mb-8">
              <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                开始使用前，请粘贴您的JSON数据或按下快捷键导入内容。
              </p>

              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 font-mono text-xs text-gray-600 dark:text-gray-300 shadow-sm">
                  Ctrl
                </kbd>
                <span className="text-gray-400">+</span>
                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 font-mono text-xs text-gray-600 dark:text-gray-300 shadow-sm">
                  V
                </kbd>
                <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm">
                  快速粘贴
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 shadow-md hover:shadow-lg disabled:opacity-70 transition-all duration-300"
                disabled={isPasting}
                onClick={handlePaste}
              >
                {/* 按钮内闪光效果 */}
                <span className="absolute inset-0 w-full h-full json-shimmer-effect rounded-xl" />

                <span className="relative flex items-center justify-center">
                  {isPasting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>处理中...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2 transition-transform group-hover:rotate-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                        <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                      </svg>
                      <span>从剪贴板粘贴</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                支持标准JSON格式 &bull; 自动解析并显示为表格
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染错误状态 - 改进现代设计感
  const renderErrorState = () => {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-transparent via-red-50/30 to-pink-50/30 dark:from-transparent dark:via-red-900/10 dark:to-pink-900/10">
        <div className="relative max-w-2xl w-full mx-auto px-8 py-12">
          {/* 背景装饰 */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -left-20 w-96 h-96 bg-red-100/50 dark:bg-red-900/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-pink-100/50 dark:bg-pink-900/20 rounded-full blur-3xl" />
          </div>

          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30 p-8 transform transition-all duration-300">
            <div className="mx-auto mb-6 w-24 h-24 relative flex items-center justify-center">
              <div
                className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 rounded-full animate-ping opacity-70"
                style={{ animationDuration: "3s" }}
              />
              <svg
                className="w-14 h-14 text-red-500 drop-shadow-md relative z-10"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 16C12.5523 16 13 16.4477 13 17C13 17.5523 12.5523 18 12 18C11.4477 18 11 17.5523 11 17C11 16.4477 11.4477 16 12 16Z"
                  fill="currentColor"
                />
                <path
                  d="M12 7C11.4477 7 11 7.44772 11 8V13C11 13.5523 11.4477 14 12 14C12.5523 14 13 13.5523 13 13V8C13 7.44772 12.5523 7 12 7Z"
                  fill="currentColor"
                />
                <path
                  clipRule="evenodd"
                  d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z"
                  fill="currentColor"
                  fillRule="evenodd"
                />
              </svg>
            </div>

            <h3 className="text-2xl font-bold mb-3 text-center text-red-600 dark:text-red-400">
              JSON解析失败
            </h3>

            <div className="space-y-4 mb-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg p-4 overflow-auto max-h-32">
                <pre className="text-red-600 dark:text-red-400 text-sm whitespace-pre-wrap font-mono break-all">
                  {error}
                </pre>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm mb-2">
                  常见错误检查：
                </h4>
                <ul className="text-gray-600 dark:text-gray-400 text-xs space-y-1 pl-4 list-disc">
                  <li>
                    确保所有括号{" "}
                    <code className="text-red-500">{"{ }, [ ]"}</code> 正确配对
                  </li>
                  <li>
                    检查键名是否使用双引号{" "}
                    <code className="text-red-500">{'"key": value'}</code>
                  </li>
                  <li>确保每个键值对之间使用逗号分隔</li>
                  <li>确认最后一个键值对后没有多余的逗号</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              <button
                className="group relative flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 flex items-center justify-center"
                disabled={isPasting}
                onClick={handlePaste}
              >
                {isPasting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>处理中...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    <span>尝试重新粘贴</span>
                  </>
                )}
              </button>

              <a
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-sm hover:shadow transition-all duration-300 flex items-center justify-center"
                href="https://www.json.cn/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <svg
                  className="w-4 h-4 mr-2 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                <span>使用在线工具验证</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 添加样式到文档
  useEffect(() => {
    const styleElement = document.createElement("style");

    styleElement.innerHTML = globalStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full flex flex-col">
      <JsonTableOperationBar
        ref={operationBarRef}
        onCollapse={handleCollapseAll}
        onCopy={onCopy}
        onCustomView={handleCustomView}
        onExpand={handleExpandAll}
        onExport={onExport}
        onFilter={() => {}}
        onSearch={() => {}}
      />
      <div className="flex-grow overflow-hidden border border-default-200 bg-white dark:bg-gray-900">
        {error ? (
          renderErrorState()
        ) : !jsonData ? (
          renderEmptyState()
        ) : (
          <JsonTable
            data={jsonData}
            expandedPaths={expandedPaths}
            hideEmpty={hideEmpty}
            hideNull={hideNull}
            onCollapseAll={handleCollapseAll}
            onExpandAll={handleExpandAll}
            onToggleExpand={handleToggleExpand}
          />
        )}
      </div>
    </div>
  );
};

export default JsonTableView;
