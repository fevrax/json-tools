import React, { useState, useRef } from "react";

import {
  ButtonConfig,
  ButtonGroup as BarButtonGroup,
  DEFAULT_DROPDOWN_TIMEOUT,
  renderDropdownButton,
  renderMoreMenu,
  renderStandardButton,
  useAdaptiveButtons,
  useDropdownTimeout,
} from "@/components/monacoEditor/operationBar/OperationBarBase.tsx";

import { MonacoDiffEditorEditorType } from "@/components/monacoEditor/monacoEntity.ts";

interface MonacoDiffOperationBarProps {
  onCopy: (type: MonacoDiffEditorEditorType) => boolean;
  onFormat: (type: MonacoDiffEditorEditorType) => boolean;
  onClear: (type: MonacoDiffEditorEditorType) => boolean;
  onFieldSort: (
    type: MonacoDiffEditorEditorType,
    sort: "asc" | "desc",
  ) => boolean;
  onAiClick?: () => void;
  ref?: React.Ref<MonacoDiffOperationBarRef>;
}

export interface MonacoDiffOperationBarRef {}

const MonacoDiffOperationBar: React.FC<MonacoDiffOperationBarProps> = ({
  onCopy,
  onFormat,
  onClear,
  onFieldSort,
  onAiClick,
}) => {
  const [isCopyDropdownOpen, setCopyDropdownOpen] = useState(false);
  const [isFormatDropdownOpen, setFormatDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [isClearDropdownOpen, setClearDropdownOpen] = useState(false);
  const [isMoreDropdownOpen, setMoreDropdownOpen] = useState(false);

  // 容器参考
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用通用的下拉菜单超时管理hook
  const { createTimeout } = useDropdownTimeout();

  // 复制下拉菜单
  const showCopyDropdown = () => {
    setCopyDropdownOpen(true);
  };
  const unShowCopyDropdown = () => {
    createTimeout(
      "copy",
      () => setCopyDropdownOpen(false),
      DEFAULT_DROPDOWN_TIMEOUT,
    );
  };

  // 格式化下拉菜单
  const showFormatDropdown = () => {
    setFormatDropdownOpen(true);
  };
  const unShowFormatDropdown = () => {
    createTimeout(
      "format",
      () => setFormatDropdownOpen(false),
      DEFAULT_DROPDOWN_TIMEOUT,
    );
  };

  // 字段排序下拉菜单
  const showSortDropdown = () => {
    setSortDropdownOpen(true);
  };
  const unShowSortDropdown = () => {
    createTimeout(
      "sort",
      () => setSortDropdownOpen(false),
      DEFAULT_DROPDOWN_TIMEOUT,
    );
  };

  // 清空下拉菜单
  const showClearDropdown = () => {
    setClearDropdownOpen(true);
  };
  const unShowClearDropdown = () => {
    createTimeout(
      "clear",
      () => setClearDropdownOpen(false),
      DEFAULT_DROPDOWN_TIMEOUT,
    );
  };

  // 更多下拉菜单
  const showMoreDropdown = () => {
    setMoreDropdownOpen(true);
  };
  const unShowMoreDropdown = () => {
    createTimeout(
      "more",
      () => setMoreDropdownOpen(false),
      DEFAULT_DROPDOWN_TIMEOUT,
    );
  };

  // 按钮组配置
  const actionGroups: BarButtonGroup[] = [
    {
      key: "main",
      buttons: [
        {
          key: "ai",
          icon: "hugeicons:ai-chat-02",
          text: "AI助手",
          tooltip: "打开AI助手",
          onClick: onAiClick || (() => {}),
          iconColor: "text-indigo-500",
          className:
            "text-sm text-default-600 px-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-50/10 hover:bg-indigo-100/70",
          priority: 10,
          width: 110,
        },
      ],
    },
    {
      key: "edit",
      buttons: [
        {
          key: "copy",
          icon: "si:copy-line",
          text: "复制",
          tooltip: "复制内容到剪贴板",
          priority: 20,
          width: 90,
          hasDropdown: true,
          onClick: showCopyDropdown,
          dropdownItems: [
            {
              key: "left",
              icon: "mdi-light:arrow-left",
              text: "复制左边",
              onClick: () => {
                onCopy(MonacoDiffEditorEditorType.left);
                setCopyDropdownOpen(false);
              },
            },
            {
              key: "right",
              icon: "mdi-light:arrow-right",
              text: "复制右边",
              onClick: () => {
                onCopy(MonacoDiffEditorEditorType.right);
                setCopyDropdownOpen(false);
              },
            },
          ],
        },
        {
          key: "format",
          icon: "ph:magic-wand-light",
          text: "格式化",
          tooltip: "格式化JSON内容",
          priority: 30,
          width: 110,
          hasDropdown: true,
          onClick: showFormatDropdown,
          dropdownItems: [
            {
              key: "all",
              icon: "ph:magic-wand-light",
              text: "格式化全部",
              onClick: () => {
                onFormat(MonacoDiffEditorEditorType.all);
                setFormatDropdownOpen(false);
              },
            },
            {
              key: "left",
              icon: "mdi-light:arrow-left",
              text: "格式化左边",
              onClick: () => {
                onFormat(MonacoDiffEditorEditorType.left);
                setFormatDropdownOpen(false);
              },
            },
            {
              key: "right",
              icon: "mdi-light:arrow-right",
              text: "格式化右边",
              onClick: () => {
                onFormat(MonacoDiffEditorEditorType.right);
                setFormatDropdownOpen(false);
              },
            },
          ],
        },
        {
          key: "sort",
          icon: "fluent:arrow-sort-24-regular",
          text: "字段排序",
          tooltip: "对JSON字段进行排序",
          hasDropdown: true,
          priority: 40,
          width: 120,
          onClick: showSortDropdown,
          dropdownItems: [
            {
              key: "left-asc",
              icon: "mdi-light:arrow-left",
              text: "左边字段升序",
              onClick: () => {
                onFieldSort(MonacoDiffEditorEditorType.left, "asc");
                setSortDropdownOpen(false);
              },
            },
            {
              key: "left-desc",
              icon: "mdi-light:arrow-left",
              text: "左边字段降序",
              onClick: () => {
                onFieldSort(MonacoDiffEditorEditorType.left, "desc");
                setSortDropdownOpen(false);
              },
            },
            {
              key: "right-asc",
              icon: "mdi-light:arrow-right",
              text: "右边字段升序",
              onClick: () => {
                onFieldSort(MonacoDiffEditorEditorType.right, "asc");
                setSortDropdownOpen(false);
              },
            },
            {
              key: "right-desc",
              icon: "mdi-light:arrow-right",
              text: "右边字段降序",
              onClick: () => {
                onFieldSort(MonacoDiffEditorEditorType.right, "desc");
                setSortDropdownOpen(false);
              },
            },
          ],
        },
        {
          key: "clear",
          icon: "mynaui:trash",
          text: "清空",
          tooltip: "清空编辑器内容",
          priority: 50,
          width: 90,
          hasDropdown: true,
          onClick: showClearDropdown,
          dropdownItems: [
            {
              key: "all",
              icon: "mynaui:trash",
              text: "清空全部",
              onClick: () => {
                onClear(MonacoDiffEditorEditorType.all);
                setClearDropdownOpen(false);
              },
            },
            {
              key: "left",
              icon: "mdi-light:arrow-left",
              text: "清空左边",
              onClick: () => {
                onClear(MonacoDiffEditorEditorType.left);
                setClearDropdownOpen(false);
              },
            },
            {
              key: "right",
              icon: "mdi-light:arrow-right",
              text: "清空右边",
              onClick: () => {
                onClear(MonacoDiffEditorEditorType.right);
                setClearDropdownOpen(false);
              },
            },
          ],
        },
      ],
    },
  ];

  // 使用通用的自适应按钮hook
  const { visibleButtons, hiddenButtons } = useAdaptiveButtons(
    containerRef,
    actionGroups,
  );

  // 渲染按钮
  const renderButton = (button: ButtonConfig) => {
    // 检查按钮是否应该可见
    if (!visibleButtons.includes(button.key)) return null;

    // 带下拉菜单的按钮
    if ("hasDropdown" in button && button.hasDropdown) {
      switch (button.key) {
        case "copy":
          return renderDropdownButton(
            button,
            isCopyDropdownOpen,
            setCopyDropdownOpen,
            showCopyDropdown,
            unShowCopyDropdown,
          );
        case "format":
          return renderDropdownButton(
            button,
            isFormatDropdownOpen,
            setFormatDropdownOpen,
            showFormatDropdown,
            unShowFormatDropdown,
          );
        case "sort":
          return renderDropdownButton(
            button,
            isSortDropdownOpen,
            setSortDropdownOpen,
            showSortDropdown,
            unShowSortDropdown,
          );
        case "clear":
          return renderDropdownButton(
            button,
            isClearDropdownOpen,
            setClearDropdownOpen,
            showClearDropdown,
            unShowClearDropdown,
          );
      }
    }

    // 普通按钮
    return renderStandardButton(button);
  };

  return (
    <div
      ref={containerRef}
      className="h-10 flex items-center gap-2 px-2 bg-gradient-to-r from-default-50 to-default-100 border-b border-default-200 shadow-sm"
    >
      {/* 主要按钮组 */}
      <div className="flex items-center gap-2">
        {actionGroups[0].buttons.map(renderButton)}
      </div>

      {/* 分隔线 - 只在有主要按钮可见时显示 */}
      {actionGroups[0].buttons.some((button) =>
        visibleButtons.includes(button.key),
      ) && <div className="h-6 w-px bg-default-200" />}

      {/* 编辑按钮组 */}
      <div className="flex items-center gap-2">
        {actionGroups[1].buttons.map(renderButton)}

        {/* 更多菜单 */}
        {renderMoreMenu(
          hiddenButtons,
          isMoreDropdownOpen,
          setMoreDropdownOpen,
          showMoreDropdown,
          unShowMoreDropdown,
        )}
      </div>
    </div>
  );
};

export default MonacoDiffOperationBar;
