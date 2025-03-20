import React, { useState } from "react";
import { Icon } from "@iconify/react";

import JsonPathBar from "@/components/jsonTable/jsonPathBar.tsx";

interface JsonTableProps {
  data: any;
  onPathChange: (path: string) => void;
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
  const [currentPath, setCurrentPath] = useState<string>("");

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
          onClick={() => {
            onToggleExpand(path);
            setCurrentPath(path);
            onPathChange(path);
          }}
        >
          <Icon className="mr-1" icon={icon} width={16} />
          <span>{Array.isArray(value) ? `[${value.length}]` : "{...}"}</span>
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

  // 渲染对象表格 - 使用键值对形式
  const renderObjectTable = (data: object, path: string = "") => {
    const entries = Object.entries(data);

    return (
      <div className="rounded-lg border border-default-200 mb-4 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-default-50">
              <th className="w-1/3 px-4 py-2 text-left text-sm font-medium text-default-600 border-b border-default-200">
                键
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-default-600 border-b border-default-200">
                值
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value]) => {
              if ((hideEmpty && value === "") || (hideNull && value === null)) {
                return null;
              }

              const valuePath = path ? `${path}.${key}` : key;

              return (
                <tr key={key} className="hover:bg-default-50">
                  <td className="px-4 py-2 text-sm font-medium border-b border-default-200">
                    {key}
                  </td>
                  <td className="px-4 py-2 text-sm border-b border-default-200">
                    {renderCell(value, valuePath)}
                    {isExpandable(value) && expandedPaths.has(valuePath) && (
                      <div className="mt-2">
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

  // 渲染普通数组表格
  const renderArrayTable = (data: any[], path: string = "") => {
    return (
      <div className="rounded-lg border border-default-200 mb-4 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-default-50">
              <th className="w-20 px-4 py-2 text-left text-sm font-medium text-default-600 border-b border-default-200">
                索引
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-default-600 border-b border-default-200">
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
                  <td className="px-4 py-2 text-sm border-b border-default-200">
                    {index}
                  </td>
                  <td className="px-4 py-2 text-sm border-b border-default-200">
                    {renderCell(item, itemPath)}
                    {isExpandable(item) && expandedPaths.has(itemPath) && (
                      <div className="mt-2">
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

  // 渲染对象数组表格 - 使用字段名作为表头
  const renderObjectsArrayTable = (data: any[], path: string = "") => {
    const allKeys = getAllObjectKeys(data);

    if (allKeys.length === 0) {
      return renderArrayTable(data, path);
    }

    return (
      <div className="rounded-lg border border-default-200 mb-4 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-default-50">
              <th className="w-20 px-4 py-2 text-left text-sm font-medium text-default-600 border-b border-default-200">
                索引
              </th>
              {allKeys.map((key) => (
                <th
                  key={key}
                  className="px-4 py-2 text-left text-sm font-medium text-default-600 border-b border-default-200"
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
                  <td className="px-4 py-2 text-sm border-b border-default-200">
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
                          className="px-4 py-2 text-sm border-b border-default-200"
                        >
                          -
                        </td>
                      );
                    }

                    return (
                      <td
                        key={key}
                        className="px-4 py-2 text-sm border-b border-default-200"
                      >
                        {renderCell(value, cellPath)}
                        {isExpandable(value) && expandedPaths.has(cellPath) && (
                          <div className="mt-2">
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
    if (!data) return <div className="text-center py-4">没有数据</div>;

    if (Array.isArray(data)) {
      if (isObjectArray(data)) {
        // 如果数组中的所有元素都是对象，则使用对象数组表格渲染
        return renderObjectsArrayTable(data, "");
      } else {
        // 否则使用普通数组表格渲染
        return renderArrayTable(data, "");
      }
    } else if (typeof data === "object" && data !== null) {
      return renderObjectTable(data, "");
    } else {
      return <div className="p-4">{renderCell(data, "")}</div>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <JsonPathBar
        currentPath={currentPath}
        onCollapse={onCollapseAll}
        onExpand={onExpandAll}
      />
      <div className="flex-grow overflow-auto p-4">{renderRootTable()}</div>
    </div>
  );
};

export default JsonTable;
