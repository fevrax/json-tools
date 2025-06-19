import React, { useState, useRef } from "react";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";

import {
  ButtonConfig,
  ButtonGroup as BarButtonGroup,
  DEFAULT_DROPDOWN_TIMEOUT,
  IconStatus,
  renderDropdownButton,
  renderMoreMenu,
  renderStandardButton,
  useAdaptiveButtons,
  useDropdownTimeout,
} from "@/components/monacoEditor/operationBar/OperationBarBase.tsx";

import StatusButton from "@/components/button/StatusButton.tsx";
import toast from "@/utils/toast.tsx";

interface MonacoOperationBarProps {
  onCopy: (type?: "default" | "compress" | "escape") => boolean;
  onFormat: () => boolean;
  onClear: () => boolean;
  onFieldSort: (type: "asc" | "desc") => boolean;
  onMore: (key: "unescape" | "del_comment") => boolean;
  onSaveFile: () => boolean;
  onAiClick?: () => void;
  ref?: React.RefObject<MonacoOperationBarRef> | null;
}

export interface MonacoOperationBarRef {}

const MonacoOperationBar: React.FC<MonacoOperationBarProps> = ({
  onCopy,
  onFormat,
  onClear,
  onFieldSort,
  onSaveFile,
  onMore,
  onAiClick,
}) => {
  const [isCopyDropdownOpen, setIsCopyDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [isMoreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<IconStatus>(IconStatus.Default);
  const [formatStatus, setFormatStatus] = useState<IconStatus>(
    IconStatus.Default,
  );
  const [clearStatus, setClearStatus] = useState<IconStatus>(
    IconStatus.Default,
  );

  // 容器参考
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用通用的下拉菜单超时管理hook
  const { createTimeout } = useDropdownTimeout();

  const handleCopy = (type?: "compress" | "escape") => {
    onCopy(type);
    setIsCopyDropdownOpen(false);
  };

  // 复制下拉菜单
  const showCopyDropdown = () => {
    setIsCopyDropdownOpen(true);
  };
  const unShowCopyDropdown = () => {
    createTimeout(
      "copy",
      () => setIsCopyDropdownOpen(false),
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

  const handleAction = (action: "unescape" | "del_comment" | "save_file") => {
    switch (action) {
      case "unescape":
        if (onMore("unescape")) {
          toast.success("删除转义成功");
        }
        break;
      case "del_comment":
        if (onMore("del_comment")) {
          toast.success("删除注释成功");
        } else {
          toast.error("删除注释失败");
        }
        break;
      case "save_file":
        if (!onSaveFile()) {
          toast.error("下载文件到本地失败");
        }
        break;
    }
    // 执行操作后关闭更多菜单
    setMoreDropdownOpen(false);
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
          isStatusButton: true,
          icon: "si:copy-line",
          text: "复制",
          tooltip: "复制内容到剪贴板",
          status: copyStatus,
          successText: "已复制",
          priority: 20,
          width: 90,
          onClick: () => {
            setTimeout(() => {
              setCopyStatus(IconStatus.Default);
            }, 1000);
            setCopyStatus(onCopy() ? IconStatus.Success : IconStatus.Error);
          },
        },
        {
          key: "format",
          isStatusButton: true,
          icon: "ph:magic-wand-light",
          text: "格式化",
          tooltip: "格式化当前JSON",
          status: formatStatus,
          priority: 30,
          width: 110,
          onClick: () => {
            setTimeout(() => {
              setFormatStatus(IconStatus.Default);
            }, 2000);
            setFormatStatus(onFormat() ? IconStatus.Success : IconStatus.Error);
          },
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
              key: "asc",
              icon: "mdi:sort-alphabetical-ascending",
              text: "字段升序",
              onClick: () => {
                onFieldSort("asc");
                toast.success("字段排序成功");
                setSortDropdownOpen(false);
              },
            },
            {
              key: "desc",
              icon: "mdi:sort-alphabetical-descending",
              text: "字段降序",
              onClick: () => {
                onFieldSort("desc");
                toast.success("字段排序成功");
                setSortDropdownOpen(false);
              },
            },
          ],
        },
        {
          key: "clear",
          isStatusButton: true,
          icon: "mynaui:trash",
          text: "清空",
          tooltip: "清空编辑器内容",
          status: clearStatus,
          successText: "已清空",
          priority: 50,
          width: 90,
          onClick: () => {
            setTimeout(() => {
              setClearStatus(IconStatus.Default);
            }, 1000);
            setClearStatus(onClear() ? IconStatus.Success : IconStatus.Error);
          },
        },
      ],
    },
    {
      key: "advanced",
      buttons: [
        {
          key: "unescape",
          icon: "iconoir:remove-link",
          text: "删除转义",
          tooltip: "删除JSON中的转义字符",
          onClick: () => handleAction("unescape"),
          priority: 60,
          width: 120,
        },
        {
          key: "del_comment",
          icon: "tabler:notes-off",
          text: "删除注释",
          tooltip: "删除JSON中的注释",
          onClick: () => handleAction("del_comment"),
          priority: 70,
          width: 120,
        },
        {
          key: "save_file",
          icon: "ic:round-save-alt",
          text: "下载文件",
          tooltip: "将当前内容保存为文件",
          onClick: () => handleAction("save_file"),
          priority: 80,
          width: 120,
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

    // 状态按钮
    if ("isStatusButton" in button && button.isStatusButton) {
      return (
        <div key={button.key} className="flex">
          <Tooltip content={button.tooltip} delay={300}>
            <StatusButton
              icon={button.icon}
              status={button.status}
              successText={button.successText}
              text={button.text}
              onClick={button.onClick}
            />
          </Tooltip>

          {/* 复制按钮额外的下拉菜单 */}
          {button.key === "copy" && (
            <Dropdown
              classNames={{
                base: "before:bg-default-200",
                content: "min-w-[140px] p-1",
              }}
              isOpen={isCopyDropdownOpen}
              radius="sm"
              onOpenChange={setIsCopyDropdownOpen}
            >
              <DropdownTrigger
                onMouseEnter={showCopyDropdown}
                onMouseLeave={unShowCopyDropdown}
              >
                <Button
                  isIconOnly
                  className="p-0 m-0 min-w-[22px] w-auto h-8 transition-colors hover:bg-default-200/50"
                  startContent={<Icon icon="formkit:down" width={16} />}
                  variant="light"
                />
              </DropdownTrigger>
              <DropdownMenu
                aria-label="复制选项"
                onMouseEnter={showCopyDropdown}
                onMouseLeave={unShowCopyDropdown}
              >
                <DropdownItem
                  key="compress"
                  className="py-2 px-3 hover:bg-default-100 rounded-md"
                  textValue="压缩后复制"
                  onPress={() => handleCopy("compress")}
                >
                  <div className="flex items-center space-x-2">
                    <Icon icon="f7:rectangle-compress-vertical" width={16} />
                    <span>压缩后复制</span>
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="escape"
                  className="py-2 px-3 hover:bg-default-100 rounded-md"
                  textValue="转义后复制"
                  onPress={() => handleCopy("escape")}
                >
                  <div className="flex items-center space-x-2">
                    <Icon icon="si:swap-horiz-line" width={16} />
                    <span>转义后复制</span>
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      );
    }

    // 带下拉菜单的按钮
    if ("hasDropdown" in button && button.hasDropdown) {
      if (button.key === "sort") {
        return renderDropdownButton(
          button,
          isSortDropdownOpen,
          setSortDropdownOpen,
          showSortDropdown,
          unShowSortDropdown,
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
      </div>

      {/* 分隔线 - 只在有编辑按钮和高级按钮都可见时显示 */}
      {actionGroups[1].buttons.some((button) =>
        visibleButtons.includes(button.key),
      ) &&
        actionGroups[2].buttons.some((button) =>
          visibleButtons.includes(button.key),
        ) && <div className="h-6 w-px bg-default-200" />}

      {/* 高级按钮组 */}
      <div className="flex items-center gap-2">
        {actionGroups[2].buttons.map(renderButton)}

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

export default MonacoOperationBar;
