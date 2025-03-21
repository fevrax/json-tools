import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

import JsonPathBar from "@/components/jsonTable/jsonPathBar.tsx";

interface JsonTableProps {
  data: any;
  onPathChange?: (path: string) => void;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  hideEmpty?: boolean;
  hideNull?: boolean;
}

const JsonTable: React.FC<JsonTableProps> = ({
  data,
  onPathChange,
  expandedPaths,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  hideEmpty = false,
  hideNull = false,
}) => {
  const [currentPath, setCurrentPath] = useState<string>("root");

  // 添加自动展开单个子元素的函数
  const collectSingleChildPaths = (value: any, path: string = "root", paths: Set<string> = new Set()): Set<string> => {
    if (typeof value !== "object" || value === null) {
      return paths;
    }

    if (Array.isArray(value)) {
      if (value.length === 1) {
        paths.add(path);
        collectSingleChildPaths(value[0], `${path}[0]`, paths);
      } else {
        // 遍历数组中的所有元素
        value.forEach((item, index) => {
          if (typeof item === "object" && item !== null) {
            collectSingleChildPaths(item, `${path}[${index}]`, paths);
          }
        });
      }
    } else {
      const keys = Object.keys(value);
      if (keys.length === 1) {
        paths.add(path);
        collectSingleChildPaths(value[keys[0]], `${path}.${keys[0]}`, paths);
      } else {
        // 遍历对象中的所有属性
        keys.forEach(key => {
          if (typeof value[key] === "object" && value[key] !== null) {
            collectSingleChildPaths(value[key], `${path}.${key}`, paths);
          }
        });
      }
    }

    return paths;
  };

  // 添加初始化自动展开的useEffect
  useEffect(() => {
    const pathsToExpand = collectSingleChildPaths(data);
    pathsToExpand.forEach((path) => {
      if (!expandedPaths.has(path)) {
        onToggleExpand(path);
      }
    });
  }, [data]); // 仅在data变化时执行

  // 修改滚动到元素的函数
  const scrollToElement = (path: string) => {
    const element = document.getElementById(`json-path-${path}`);

    if (element) {
      const container = element.closest(".overflow-auto");

      if (container) {
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // 添加滚动偏移量，使滚动位置稍微小一点
        const offset = 40; // 偏移量，可以根据需要调整

        // 计算水平和垂直方向的滚动位置
        const scrollLeft =
          elementRect.left - containerRect.left + container.scrollLeft - offset;
        const scrollTop =
          elementRect.top - containerRect.top + container.scrollTop - offset;

        // 平滑滚动到目标位置
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          top: Math.max(0, scrollTop),
          behavior: "smooth",
        });
      } else {
        // 使用scrollIntoView时添加margin
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // 监听展开路径变化
  useEffect(() => {
    if (currentPath) {
      scrollToElement(currentPath);
    }
  }, [currentPath]);

  // 判断值是否为可展开的对象或数组
  const isExpandable = (value: any): boolean => {
    return typeof value === "object" && value !== null;
  };

  // 判断是否是对象数组
  const isObjectArray = (data: any[]): boolean => {
    return (
      data.length > 0 &&
      data.every((item) => typeof item === "object" && item !== null)
    );
  };

  // 获取所有对象字段的集合
  const getAllObjectKeys = (objects: object[]): string[] => {
    const keysSet = new Set<string>();

    objects.forEach((obj) => {
      if (obj && typeof obj === "object") {
        Object.keys(obj).forEach((key) => keysSet.add(key));
      }
    });

    return Array.from(keysSet);
  };

  // 渲染单元格内容
  const renderCell = (value: any, path: string) => {
    if (value === null) return <span className="text-gray-500">null</span>;
    if (value === undefined)
      return <span className="text-gray-500">undefined</span>;

    if (isExpandable(value)) {
      const isExpanded = expandedPaths.has(path);
      const icon = isExpanded ? "tabler:chevron-down" : "tabler:chevron-right";

      return (
        <button
          className="flex items-center cursor-pointer hover:text-primary bg-transparent border-0 p-0"
          id={`json-path-${path}`}
          onClick={() => {
            onToggleExpand(path);
            setCurrentPath(path);
            onPathChange && onPathChange(path);
            scrollToElement(path);
          }}
        >
          <Icon className="mr-1" icon={icon} width={16} />
          <span>
            {Array.isArray(value)
              ? `Array[ ${value.length} ]`
              : `Object{ ${Object.keys(value).length} }`}
          </span>
        </button>
      );
    }

    if (typeof value === "string")
      return <span className="text-green-600">&quot;{value}&quot;</span>;
    if (typeof value === "number")
      return <span className="text-blue-600">{value}</span>;
    if (typeof value === "boolean")
      return <span className="text-purple-600">{String(value)}</span>;

    return <span>{String(value)}</span>;
  };

  // 修改表格容器的样式
  const renderObjectTable = (data: object, path: string = "root") => {
    const entries = Object.entries(data);

    return (
      <div className="border border-default-200 mb-2 overflow-x-auto inline-block">
        <table className="border-collapse w-auto">
          <tbody>
            {entries.map(([key, value]) => {
              if ((hideEmpty && value === "") || (hideNull && value === null)) {
                return null;
              }

              const valuePath = path ? `${path}.${key}` : key;

              return (
                <tr key={key} className="hover:bg-default-50">
                  <td className="px-4 py-1 text-sm font-medium border border-default-200">
                    {key}
                  </td>
                  <td className="px-4 py-1 text-sm border border-default-200">
                    {renderCell(value, valuePath)}
                    {isExpandable(value) && expandedPaths.has(valuePath) && (
                      <div className="mt-1">
                        {Array.isArray(value)
                          ? isObjectArray(value)
                            ? renderObjectsArrayTable(value, valuePath)
                            : renderArrayTable(value, valuePath)
                          : renderObjectTable(value, valuePath)}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderArrayTable = (data: any[], path: string = "root") => {
    return (
      <div className="border border-default-200 mb-2 overflow-x-auto inline-block">
        <table className="border-collapse w-auto">
          <thead>
            <tr className="bg-default-50">
              <th className="w-16 px-4 py-1 text-left text-sm font-medium text-default-600 border border-default-200">
                #
              </th>
              <th className="px-4 py-1 text-left text-sm font-medium text-default-600 border border-default-200">
                值
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              if ((hideEmpty && item === "") || (hideNull && item === null)) {
                return null;
              }

              const itemPath = `${path}[${index}]`;

              return (
                <tr key={index} className="hover:bg-default-50">
                  <td className="px-4 py-1 text-sm border border-default-200">
                    {index}
                  </td>
                  <td className="px-4 py-1 text-sm border border-default-200">
                    {renderCell(item, itemPath)}
                    {isExpandable(item) && expandedPaths.has(itemPath) && (
                      <div className="mt-1">
                        {Array.isArray(item)
                          ? isObjectArray(item)
                            ? renderObjectsArrayTable(item, itemPath)
                            : renderArrayTable(item, itemPath)
                          : renderObjectTable(item, itemPath)}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderObjectsArrayTable = (data: any[], path: string = "root") => {
    const allKeys = getAllObjectKeys(data);

    if (allKeys.length === 0) {
      return renderArrayTable(data, path);
    }

    return (
      <div className="border border-default-200 mb-2 overflow-x-auto inline-block">
        <table className="border-collapse w-auto">
          <thead>
            <tr className="bg-default-50">
              <th className="w-16 px-4 py-1 text-left text-sm font-medium text-default-600 border border-default-200">
                #
              </th>
              {allKeys.map((key) => (
                <th
                  key={key}
                  className="px-4 py-1 text-left text-sm font-medium text-default-600 border border-default-200"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              if ((hideEmpty && item === "") || (hideNull && item === null)) {
                return null;
              }

              const itemPath = `${path}[${index}]`;

              return (
                <tr key={index} className="hover:bg-default-50">
                  <td className="px-4 py-1 text-sm border border-default-200">
                    {index}
                  </td>
                  {allKeys.map((key) => {
                    const value = item[key];
                    const cellPath = `${itemPath}.${key}`;

                    if (
                      (hideEmpty && value === "") ||
                      (hideNull && value === null)
                    ) {
                      return (
                        <td
                          key={key}
                          className="px-4 py-1 text-sm border border-default-200"
                        >
                          -
                        </td>
                      );
                    }

                    return (
                      <td
                        key={key}
                        className="px-4 py-1 text-sm border border-default-200"
                      >
                        {renderCell(value, cellPath)}
                        {isExpandable(value) && expandedPaths.has(cellPath) && (
                          <div className="mt-1">
                            {Array.isArray(value)
                              ? isObjectArray(value)
                                ? renderObjectsArrayTable(value, cellPath)
                                : renderArrayTable(value, cellPath)
                              : renderObjectTable(value, cellPath)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // 渲染根表格
  const renderRootTable = () => {
    if (!data) return <div className="text-center py-2">没有数据</div>;

    if (Array.isArray(data)) {
      if (isObjectArray(data)) {
        // 如果数组中的所有元素都是对象，则使用对象数组表格渲染
        return renderObjectsArrayTable(data, "root");
      } else {
        // 否则使用普通数组表格渲染
        return renderArrayTable(data, "root");
      }
    } else if (typeof data === "object" && data !== null) {
      return renderObjectTable(data, "root");
    } else {
      return (
        <div className="p-2 border border-default-200">
          {renderCell(data, "root")}
        </div>
      );
    }
  };

  return (
    <div className="h-full flex flex-col">
      <JsonPathBar
        currentPath={currentPath}
        onCollapse={onCollapseAll}
        onExpand={onExpandAll}
      />
      <div className="flex-grow overflow-auto p-2">{renderRootTable()}</div>
    </div>
  );
};

export default JsonTable;
