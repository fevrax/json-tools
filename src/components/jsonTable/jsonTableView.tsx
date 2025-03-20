import React, { useCallback, useRef, useState } from "react";

import JsonTableOperationBar, {
  JsonTableOperationBarRef,
} from "./jsonTableOperationBar";
import JsonTable from "./jsonTable";

interface JsonTableViewProps {
  data: any;
  onCopy: (type?: "default" | "compress" | "escape") => boolean;
  onExport: (type: "csv" | "excel") => boolean;
}

const JsonTableView: React.FC<JsonTableViewProps> = ({
  data,
  onCopy,
  onExport,
}) => {
  const operationBarRef = useRef<JsonTableOperationBarRef>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [currentPath, setCurrentPath] = useState<string>("");
  const [hideEmpty, setHideEmpty] = useState(false);
  const [hideNull, setHideNull] = useState(false);

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

  // 展开所有路径
  const handleExpandAll = useCallback(() => {
    const paths = new Set<string>();
    const traverse = (obj: any, path: string = "") => {
      if (typeof obj === "object" && obj !== null) {
        paths.add(path);
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            traverse(item, `${path}[${index}]`);
          });
        } else {
          Object.entries(obj).forEach(([key, value]) => {
            traverse(value, path ? `${path}.${key}` : key);
          });
        }
      }
    };

    traverse(data);
    setExpandedPaths(paths);
  }, [data]);

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

  return (
    <div className="h-full flex flex-col">
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
      <div className="flex-grow overflow-hidden border border-default-200 rounded-lg">
        <JsonTable
          data={data}
          expandedPaths={expandedPaths}
          hideEmpty={hideEmpty}
          hideNull={hideNull}
          onCollapseAll={handleCollapseAll}
          onExpandAll={handleExpandAll}
          onPathChange={setCurrentPath}
          onToggleExpand={handleToggleExpand}
        />
      </div>
    </div>
  );
};

export default JsonTableView;
