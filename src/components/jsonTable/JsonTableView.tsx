import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/react";
import { isLosslessNumber } from "lossless-json";

import JsonTableOperationBar, {
  JsonTableOperationBarRef,
} from "@/components/jsonTable/JsonTableOperationBar.tsx";
import JsonTable from "@/components/jsonTable/JsonTable.tsx";
import toast from "@/utils/toast";
import clipboard from "@/utils/clipboard";
import { useSidebarStore } from "@/store/useSidebarStore";
import { SidebarKeys } from "@/components/sidebar/Items.tsx";
import { parseJson, stringifyJson } from "@/utils/json";

export interface JsonTableViewRef {
  focus: () => void;
  layout: () => void;
  getSelectedNode: () => any;
  getSelectedPath: () => string | null;
  exportAsCSV: () => string | null;
  exportAsExcel: () => ArrayBuffer | null;
}

interface JsonTableViewProps {
  data: string;
  onCopy: (type?: "default" | "node" | "path") => boolean;
  onDataUpdate?: (data: string) => void;
  onMount?: () => void;
  ref?: React.Ref<JsonTableViewRef>;
}

const JsonTableView: React.FC<JsonTableViewProps> = ({
  data,
  onCopy,
  onDataUpdate,
  onMount,
  ref,
}) => {
  const operationBarRef = useRef<JsonTableOperationBarRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [hideEmpty, setHideEmpty] = useState(false);
  const [hideNull, setHideNull] = useState(false);
  const [jsonData, setJsonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [isSwitchingEditor, setIsSwitchingEditor] = useState(false);
  const [lastValidJsonData, setLastValidJsonData] = useState<any>(null);
  const [previousRenderedView, setPreviousRenderedView] =
    useState<React.ReactNode | null>(null);
  const sidebarStore = useSidebarStore();
  const [shouldShowEmpty, setShouldShowEmpty] = useState(false);
  const emptyStateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // 筛选相关状态
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // 计算表格模式
  const tableMode = useMemo<"objectsArray" | "object" | "array" | "primitive">(() => {
    if (!jsonData || typeof jsonData !== "object" || isLosslessNumber(jsonData)) return "primitive";
    if (Array.isArray(jsonData)) {
      if (jsonData.length > 0 && jsonData.every((item: any) => typeof item === "object" && item !== null && !isLosslessNumber(item))) return "objectsArray";
      return "array";
    }
    return "object";
  }, [jsonData]);

  // JSON 数据变化时重置筛选状态
  useEffect(() => {
    setColumnFilters({});
    setGlobalFilter("");
  }, [jsonData]);

  useEffect(() => {
    const handlePasteAction = async () => {
      try {
        setIsPasting(true);
        if (emptyStateTimerRef.current) {
          clearTimeout(emptyStateTimerRef.current);
          emptyStateTimerRef.current = null;
        }
        setShouldShowEmpty(false);

        let text;

        if (clipboard.isSupported()) {
          text = await navigator.clipboard.readText();
        } else {
          text = await clipboard.read(
            "无法读取剪贴板内容, 请从文本编辑器中粘贴。",
          );
        }

        if (!text) {
          setIsPasting(false);
          emptyStateTimerRef.current = setTimeout(() => {
            setShouldShowEmpty(true);
          }, 500);

          return;
        }

        // 尝试解析JSON
        try {
          parseJson(text);

          // 解析成功，更新数据
          if (onDataUpdate) {
            onDataUpdate(text);
            setError(null);
            toast.success("JSON数据已成功粘贴！");
          }
        } catch (parseErr) {
          // 解析失败，设置错误状态
          setError((parseErr as Error).message || "JSON解析错误");
          setJsonData(null);
          setShouldShowEmpty(false);
          toast.error(`无效的JSON数据：${(parseErr as Error).message}`);

          // 如果有onDataUpdate回调，也可以选择更新数据（取决于应用需求）
          if (onDataUpdate) {
            onDataUpdate(text);
          }
        }
      } catch (err) {
        toast.error(`粘贴操作失败：${(err as Error).message}`);
      } finally {
        setIsPasting(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        // 当焦点在输入框内时，不拦截粘贴事件，避免与筛选搜索框等输入组件冲突
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === "INPUT" ||
            activeEl.tagName === "TEXTAREA" ||
            (activeEl as HTMLElement).isContentEditable)
        ) {
          return;
        }
        if (!clipboard.isSupported()) {
          e.preventDefault();
        }
        handlePasteAction();
      }
    };

    (window as any).__jsonTablePasteHandler = handlePasteAction;

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      delete (window as any).__jsonTablePasteHandler;
    };
  }, [onDataUpdate]);

  React.useEffect(() => {
    if (emptyStateTimerRef.current) {
      clearTimeout(emptyStateTimerRef.current);
      emptyStateTimerRef.current = null;
    }

    if (!data || data.trim() === "") {
      setJsonData(null);
      if (!isSwitchingEditor) {
        setError(null);
        emptyStateTimerRef.current = setTimeout(() => {
          setShouldShowEmpty(true);
        }, 300);
      }

      return;
    }

    try {
      const parsed = parseJson(data);

      setJsonData(parsed);
      setLastValidJsonData(parsed);
      setError(null);
      setShouldShowEmpty(false);
    } catch (err) {
      setJsonData(null);
      if (!isSwitchingEditor) {
        setError((err as Error).message || "JSON解析错误");
        setShouldShowEmpty(false);
      }
    }
  }, [data, isSwitchingEditor]);

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

  const handlePaste = useCallback(() => {
    const pasteHandler = (window as any).__jsonTablePasteHandler;

    if (pasteHandler) {
      pasteHandler();
    } else {
      const vEvent = new KeyboardEvent("keydown", {
        key: "v",
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(vEvent);
    }
  }, []);

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

  const handleCollapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

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

  const handleSwitchToTextEditor = useCallback(() => {
    if (jsonData) {
      setPreviousRenderedView(
        <JsonTable
          data={jsonData}
          expandedPaths={expandedPaths}
          hideEmpty={hideEmpty}
          hideNull={hideNull}
          onCollapseAll={handleCollapseAll}
          onExpandAll={handleExpandAll}
          onToggleExpand={handleToggleExpand}
        />,
      );
    } else if (error) {
      setPreviousRenderedView(renderErrorState());
    }

    if (emptyStateTimerRef.current) {
      clearTimeout(emptyStateTimerRef.current);
      emptyStateTimerRef.current = null;
    }
    setShouldShowEmpty(false);

    setIsSwitchingEditor(true);

    setTimeout(() => {
      sidebarStore.updateClickSwitchKey(SidebarKeys.textView);
    }, 50);
  }, [sidebarStore, jsonData, error, expandedPaths, hideEmpty, hideNull]);

  const renderEmptyState = () => {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-default-50 dark:bg-vscode-dark p-4 sm:p-6">
        <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4 sm:gap-5">
          <div className="p-3 sm:p-4 rounded-2xl bg-primary/15">
            <Icon
              className="text-primary w-8 h-8 sm:w-10 sm:h-10"
              icon="solar:document-text-bold-duotone"
            />
          </div>

          <div className="text-center space-y-1.5 sm:space-y-2">
            <h3 className="text-lg sm:text-xl font-bold text-default-900">
              JSON 表格视图
            </h3>
            <p className="text-sm text-default-500 max-w-xs mx-auto leading-relaxed">
              粘贴您的 JSON 数据以表格形式浏览
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-default-100 rounded-lg">
            <kbd className="px-1.5 py-0.5 bg-default-50 dark:bg-default-200/50 rounded border border-default-200 font-mono text-xs text-default-600">
              Ctrl
            </kbd>
            <span className="text-default-300 text-xs">+</span>
            <kbd className="px-1.5 py-0.5 bg-default-50 dark:bg-default-200/50 rounded border border-default-200 font-mono text-xs text-default-600">
              V
            </kbd>
            <span className="text-default-400 text-xs ml-1">快速粘贴</span>
          </div>

          <Button
            color="primary"
            isDisabled={isPasting}
            radius="full"
            size="md"
            startContent={
              isPasting ? (
                <Icon className="animate-spin" icon="svg-spinners:ring-resize" width={18} />
              ) : (
                <Icon icon="solar:clipboard-bold" width={18} />
              )
            }
            variant="solid"
            onPress={handlePaste}
          >
            {isPasting ? "处理中..." : "从剪贴板粘贴"}
          </Button>

          <p className="text-xs text-default-400 text-center">
            支持标准 JSON 格式 · 自动解析并显示为表格
          </p>
        </div>
      </div>
    );
  };

  const renderErrorState = () => {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-default-50 dark:bg-vscode-dark p-4 sm:p-6">
        <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4 sm:gap-5">
          <div className="p-3 sm:p-4 rounded-2xl bg-danger/15">
            <Icon
              className="text-danger w-8 h-8 sm:w-10 sm:h-10"
              icon="solar:danger-triangle-bold-duotone"
            />
          </div>

          <div className="text-center space-y-1.5">
            <h3 className="text-lg sm:text-xl font-bold text-danger">
              JSON 解析失败
            </h3>
            <p className="text-sm text-default-500">请检查数据格式后重试</p>
          </div>

          <div className="w-full bg-danger/10 border border-danger/20 rounded-xl p-3 sm:p-4 overflow-auto max-h-28 sm:max-h-32">
            <pre className="text-danger text-xs sm:text-sm whitespace-pre-wrap font-mono break-all leading-relaxed">
              {error}
            </pre>
          </div>

          <div className="w-full p-3 rounded-xl bg-default-100 border border-default-200">
            <div className="flex items-start gap-2.5">
              <Icon
                className="text-default-400 mt-0.5 flex-shrink-0"
                icon="solar:info-circle-bold"
                width={16}
              />
              <ul className="text-xs text-default-500 space-y-1">
                <li>
                  确保所有括号 <code className="text-danger">{"{ } [ ]"}</code>{" "}
                  正确配对
                </li>
                <li>
                  键名使用双引号{" "}
                  <code className="text-danger">{'"key": value'}</code>
                </li>
                <li>键值对之间使用逗号分隔</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full gap-3">
            <Button
              className="w-full sm:flex-1"
              color="danger"
              isDisabled={isPasting}
              radius="lg"
              size="md"
              startContent={
                isPasting ? (
                  <Icon
                    className="animate-spin"
                    icon="svg-spinners:ring-resize"
                    width={18}
                  />
                ) : (
                  <Icon icon="solar:clipboard-bold" width={18} />
                )
              }
              variant="solid"
              onPress={handlePaste}
            >
              {isPasting ? "处理中..." : "重新粘贴"}
            </Button>

            <Button
              className="w-full sm:flex-1"
              color="default"
              radius="lg"
              size="md"
              startContent={<Icon icon="solar:code-bold" width={18} />}
              variant="bordered"
              onPress={handleSwitchToTextEditor}
            >
              JSON 解析器
            </Button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const styleElement = document.createElement("style");

    styleElement.textContent = `
      .editor-fade-exit {
        opacity: 1;
        transition: opacity 200ms ease-out;
      }
      .editor-fade-exit-active {
        opacity: 0;
      }
    `;

    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    return () => {
      setIsSwitchingEditor(false);
      if (emptyStateTimerRef.current) {
        clearTimeout(emptyStateTimerRef.current);
        emptyStateTimerRef.current = null;
      }
    };
  }, []);

  // 添加选择路径的处理函数
  const handlePathSelection = useCallback((path: string) => {
    setSelectedPath(path);
  }, []);

  // 筛选回调
  const handleFilterToggle = useCallback(() => {
    setIsFilterActive((prev) => {
      if (prev) {
        setColumnFilters({});
        setGlobalFilter("");
      }
      return !prev;
    });
  }, []);

  const handleColumnFilterChange = useCallback(
    (columnKey: string, selectedValues: Set<string>) => {
      setColumnFilters((prev) => {
        const next = { ...prev };
        if (!selectedValues || selectedValues.size === 0) {
          delete next[columnKey];
        } else {
          next[columnKey] = Array.from(selectedValues);
        }
        return next;
      });
    },
    [],
  );

  const handleGlobalFilterChange = useCallback((value: string) => {
    setGlobalFilter(value);
  }, []);

  const currentContent = React.useMemo(() => {
    if (isSwitchingEditor) {
      if (previousRenderedView) {
        return previousRenderedView;
      } else if (lastValidJsonData) {
        return (
          <JsonTable
            data={lastValidJsonData}
            expandedPaths={expandedPaths}
            hideEmpty={hideEmpty}
            hideNull={hideNull}
            onCollapseAll={handleCollapseAll}
            onExpandAll={handleExpandAll}
            onPathChange={handlePathSelection}
            onToggleExpand={handleToggleExpand}
          />
        );
      }

      return null;
    }

    if (error) {
      return renderErrorState();
    }

    if (!jsonData) {
      if (shouldShowEmpty) {
        return renderEmptyState();
      }

      return (
        <div className="h-full flex items-center justify-center bg-transparent">
          <div className="w-10 h-10 text-primary/50">
            <Icon className="w-full h-full" icon="svg-spinners:ring-resize" />
          </div>
        </div>
      );
    }

    return (
      <JsonTable
        data={jsonData}
        expandedPaths={expandedPaths}
        hideEmpty={hideEmpty}
        hideNull={hideNull}
        onCollapseAll={handleCollapseAll}
        onExpandAll={handleExpandAll}
        onPathChange={handlePathSelection}
        onToggleExpand={handleToggleExpand}
        columnFilters={isFilterActive ? columnFilters : undefined}
        globalFilter={isFilterActive ? globalFilter : undefined}
        onColumnFilterChange={handleColumnFilterChange}
      />
    );
  }, [
    jsonData,
    error,
    isSwitchingEditor,
    previousRenderedView,
    lastValidJsonData,
    expandedPaths,
    hideEmpty,
    hideNull,
    shouldShowEmpty,
    handleCollapseAll,
    handleExpandAll,
    handleToggleExpand,
    handlePathSelection,
    isFilterActive,
    columnFilters,
    globalFilter,
    handleColumnFilterChange,
  ]);

  // 获取选中路径的节点数据
  const getNodeAtPath = useCallback((path: string | null, data: any): any => {
    if (!path || !data) return null;

    try {
      // 处理根路径
      if (path === "root") {
        return data;
      }

      // 移除根路径前缀
      const cleanPath = path.startsWith("root") ? path.substring(4) : path;

      // 解析路径并获取节点
      const parts = cleanPath.split(/\.|\[|\]/).filter(Boolean);
      let current = data;

      for (const part of parts) {
        if (!current) return null;

        // 处理数组索引或对象键
        if (!isNaN(Number(part))) {
          // 数组索引
          current = current[Number(part)];
        } else {
          // 对象键
          current = current[part];
        }
      }

      return current;
    } catch (error) {
      console.error("获取节点数据失败:", error);

      return null;
    }
  }, []);

  // 将JSON数据转换为CSV格式
  const convertToCSV = useCallback(
    (jsonData: any): string | null => {
      if (!jsonData) return null;

      try {
        // 如果选择了特定节点，则只导出该节点
        let dataToExport = jsonData;

        if (selectedPath && selectedPath !== "root") {
          const selectedData = getNodeAtPath(selectedPath, jsonData);

          if (selectedData) {
            dataToExport = selectedData;
            // 在CSV第一行添加路径信息
            const pathInfo = `# 选中路径: ${selectedPath}`;

            // 处理选中的单个基本类型值
            if (typeof selectedData !== "object" || selectedData === null) {
              return `${pathInfo}\n${String(selectedData)}`;
            }
          }
        }

        // 处理对象数组
        if (
          Array.isArray(dataToExport) &&
          dataToExport.length > 0 &&
          typeof dataToExport[0] === "object"
        ) {
          // 获取所有可能的列
          const allKeys = new Set<string>();

          dataToExport.forEach((item) => {
            if (item && typeof item === "object") {
              Object.keys(item).forEach((key) => allKeys.add(key));
            }
          });

          // 创建标题行
          const headers = Array.from(allKeys);
          const csvRows = [headers.join(",")];

          // 创建数据行
          dataToExport.forEach((item) => {
            const row = headers.map((header) => {
              const value = item[header];

              // 处理不同类型的值，确保CSV格式正确
              if (value === null || value === undefined) return "";
              if (typeof value === "object")
                return stringifyJson(value)
                  .replace(/,/g, ";")
                  .replace(/"/g, '""');
              if (typeof value === "string")
                return `"${value.replace(/"/g, '""')}"`;

              return value;
            });

            csvRows.push(row.join(","));
          });

          return csvRows.join("\n");
        }

        // 处理简单对象
        if (typeof dataToExport === "object" && !Array.isArray(dataToExport)) {
          const headers = Object.keys(dataToExport);
          const values = Object.values(dataToExport).map((value) => {
            if (value === null || value === undefined) return "";
            if (typeof value === "object")
              return stringifyJson(value)
                .replace(/,/g, ";")
                .replace(/"/g, '""');
            if (typeof value === "string")
              return `"${value.replace(/"/g, '""')}"`;

            return value;
          });

          return [headers.join(","), values.join(",")].join("\n");
        }

        // 处理简单数组
        if (Array.isArray(dataToExport)) {
          const values = dataToExport.map((value) => {
            if (value === null || value === undefined) return "";
            if (typeof value === "object")
              return stringifyJson(value)
                .replace(/,/g, ";")
                .replace(/"/g, '""');
            if (typeof value === "string")
              return `"${value.replace(/"/g, '""')}"`;

            return value;
          });

          return values.join("\n");
        }

        // 处理简单值
        return String(dataToExport);
      } catch (error) {
        console.error("转换CSV失败:", error);
        toast.error("转换CSV失败：" + (error as Error).message);

        return null;
      }
    },
    [jsonData, selectedPath, getNodeAtPath],
  );

  // 将JSON数据转换为Excel二进制格式
  const convertToExcel = useCallback(
    (jsonData: any): ArrayBuffer | null => {
      // 由于实际生成Excel需要依赖第三方库如xlsx，
      // 这里使用一个简化的实现方式
      try {
        const csv = convertToCSV(jsonData);

        if (!csv) return null;

        // 简单将CSV转为ArrayBuffer，在实际应用中应使用专门的Excel库
        const encoder = new TextEncoder();

        return encoder.encode(csv).buffer;
      } catch (error) {
        console.error("转换Excel失败:", error);
        toast.error("转换Excel失败：" + (error as Error).message);

        return null;
      }
    },
    [convertToCSV],
  );

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (containerRef.current) {
        containerRef.current.focus();
      }
    },
    layout: () => {
      // 表格视图的布局刷新，可以根据需要实现
      // 例如，可能需要重新计算容器尺寸等
    },
    getSelectedNode: () => {
      // 获取选中节点的数据
      return getNodeAtPath(selectedPath, jsonData);
    },
    getSelectedPath: () => {
      // 返回当前选中的路径
      return selectedPath;
    },
    exportAsCSV: () => {
      // 导出为CSV
      return convertToCSV(jsonData);
    },
    exportAsExcel: () => {
      // 导出为Excel格式
      return convertToExcel(jsonData);
    },
  }));

  useEffect(() => {
    if (onMount) {
      onMount();
    }
  }, []);

  // 添加清空JSON数据的方法
  const handleClear = useCallback(() => {
    if (jsonData || error) {
      setJsonData(null);
      setError(null);
      if (onDataUpdate) {
        onDataUpdate("");
      }
      toast.success("JSON数据已清空");
      setShouldShowEmpty(true);

      return true;
    }

    return false;
  }, [jsonData, error, onDataUpdate]);

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col ${isSwitchingEditor ? "editor-fade-exit editor-fade-exit-active" : ""}`}
    >
      <JsonTableOperationBar
        ref={operationBarRef}
        onClear={handleClear}
        onCollapse={handleCollapseAll}
        onCopy={onCopy}
        onCustomView={handleCustomView}
        onExpand={handleExpandAll}
        onFilterToggle={handleFilterToggle}
        isFilterActive={isFilterActive}
        globalFilterValue={globalFilter}
        onGlobalFilterChange={handleGlobalFilterChange}
        tableMode={tableMode}
      />
      <div className="flex-grow overflow-hidden border border-default-200 bg-white dark:bg-vscode-dark">
        {currentContent}
      </div>
    </div>
  );
};

JsonTableView.displayName = "JsonTableView";

export default JsonTableView;
