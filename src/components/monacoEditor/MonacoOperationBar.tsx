import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  ButtonGroup,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";

import StatusButton, { IconStatus } from "@/components/button/StatusButton.tsx";
import toast from "@/utils/toast";

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

// 定义按钮接口
interface BaseButtonConfig {
  key: string;
  icon: string;
  text: string;
  tooltip: string;
  onClick: () => void;
  iconColor?: string;
  className?: string;
  priority?: number; // 按钮显示优先级，数字越小优先级越高
  width?: number; // 按钮的预估宽度，用于自适应计算
}

interface StatusButtonConfig extends BaseButtonConfig {
  isStatusButton: true;
  status: IconStatus;
  successText?: string;
}

interface DropdownButtonConfig extends BaseButtonConfig {
  hasDropdown: true;
  dropdownItems: {
    key: string;
    icon: string;
    text: string;
    onClick: () => void;
  }[];
}

type ButtonConfig =
  | BaseButtonConfig
  | StatusButtonConfig
  | DropdownButtonConfig;

interface ButtonGroup {
  key: string;
  buttons: ButtonConfig[];
}

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

  // 容器参考和宽度状态
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleButtons, setVisibleButtons] = useState<string[]>([]);
  const [hiddenButtons, setHiddenButtons] = useState<ButtonConfig[]>([]);

  // 防止下拉菜单打开时，鼠标移开后立即关闭
  let sortDropdownOpenTimeoutRef: NodeJS.Timeout;
  let moreDropdownOpenTimeoutRef: NodeJS.Timeout;
  let copyDropdownOpenTimeoutRef: NodeJS.Timeout;

  const dropdownTimeout = 300;

  const handleCopy = (type?: "compress" | "escape") => {
    onCopy(type);
    setIsCopyDropdownOpen(false);
  };

  // 复制下拉菜单
  const showCopyDropdown = () => {
    if (copyDropdownOpenTimeoutRef) {
      clearTimeout(copyDropdownOpenTimeoutRef);
    }
    setIsCopyDropdownOpen(true);
  };
  const unShowCopyDropdown = () => {
    if (copyDropdownOpenTimeoutRef) {
      clearTimeout(copyDropdownOpenTimeoutRef);
    }
    copyDropdownOpenTimeoutRef = setTimeout(() => {
      setIsCopyDropdownOpen(false);
    }, dropdownTimeout);
  };

  // 字段排序下拉菜单
  const showSortDropdown = () => {
    if (sortDropdownOpenTimeoutRef) {
      clearTimeout(sortDropdownOpenTimeoutRef);
    }
    setSortDropdownOpen(true);
  };
  const unShowSortDropdown = () => {
    if (sortDropdownOpenTimeoutRef) {
      clearTimeout(sortDropdownOpenTimeoutRef);
    }
    sortDropdownOpenTimeoutRef = setTimeout(() => {
      setSortDropdownOpen(false);
    }, dropdownTimeout);
  };

  // 更多下拉菜单
  const showMoreDropdown = () => {
    if (moreDropdownOpenTimeoutRef) {
      clearTimeout(moreDropdownOpenTimeoutRef);
    }
    setMoreDropdownOpen(true);
  };
  const unShowMoreDropdown = () => {
    if (moreDropdownOpenTimeoutRef) {
      clearTimeout(moreDropdownOpenTimeoutRef);
    }
    moreDropdownOpenTimeoutRef = setTimeout(() => {
      setMoreDropdownOpen(false);
    }, dropdownTimeout);
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
  const actionGroups: ButtonGroup[] = [
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

  // 更多按钮本身的宽度
  const MORE_BUTTON_WIDTH = 90;
  // 分隔线宽度
  const SEPARATOR_WIDTH = 25;
  // 最小左右间距
  const MIN_PADDING = 16;

  // 监听容器宽度变化，并计算哪些按钮可见
  useEffect(() => {
    if (!containerRef.current) return;

    const calculateVisibleButtons = () => {
      if (!containerRef.current) return;

      const width = containerRef.current.clientWidth;

      // 提取所有按钮
      const allButtons = actionGroups.flatMap((group) => group.buttons);
      // 按优先级排序按钮
      const sortedButtons = [...allButtons].sort(
        (a, b) => (a.priority || 999) - (b.priority || 999),
      );

      // 计算可用宽度 (考虑左右边距和两个分隔线)
      let availableWidth = width - 2 * MIN_PADDING - 2 * SEPARATOR_WIDTH;
      const visible: string[] = [];
      const hidden: ButtonConfig[] = [];

      // 第一次遍历，检查是否所有按钮都能显示
      let totalButtonsWidth = 0;

      for (const button of sortedButtons) {
        totalButtonsWidth += button.width || 100; // 默认宽度100
      }

      // 如果所有按钮的总宽度超过可用宽度，则需要"更多"按钮
      if (totalButtonsWidth > availableWidth) {
        availableWidth -= MORE_BUTTON_WIDTH;
      }

      // 第二次遍历，决定哪些按钮可见
      let usedWidth = 0;

      for (const button of sortedButtons) {
        const buttonWidth = button.width || 100; // 默认宽度100

        if (usedWidth + buttonWidth <= availableWidth) {
          visible.push(button.key);
          usedWidth += buttonWidth;
        } else {
          hidden.push(button);
        }
      }

      setVisibleButtons(visible);
      setHiddenButtons(hidden);
    };

    // 初始计算
    calculateVisibleButtons();

    // 创建ResizeObserver来监听容器大小变化
    const resizeObserver = new ResizeObserver(calculateVisibleButtons);

    resizeObserver.observe(containerRef.current);

    // 同时监听窗口大小变化作为后备
    window.addEventListener("resize", calculateVisibleButtons);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      window.removeEventListener("resize", calculateVisibleButtons);
    };
  }, []);

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
      const isDropdownOpen = button.key === "sort" ? isSortDropdownOpen : false;
      const setDropdownOpen =
        button.key === "sort" ? setSortDropdownOpen : undefined;

      const showDropdown = button.key === "sort" ? showSortDropdown : undefined;
      const unShowDropdown =
        button.key === "sort" ? unShowSortDropdown : undefined;

      return (
        <Dropdown
          key={button.key}
          classNames={{
            base: "before:bg-default-200",
            content: "min-w-[140px] p-1",
          }}
          isOpen={isDropdownOpen}
          radius="sm"
          onOpenChange={setDropdownOpen}
        >
          <Tooltip content={button.tooltip} delay={300}>
            <DropdownTrigger
              onMouseEnter={showDropdown}
              onMouseLeave={unShowDropdown}
            >
              <Button
                className={cn(
                  "pl-2 pr-2 h-8 gap-1 text-default-600 transition-colors text-sm",
                  button.className,
                  "hover:bg-default-200/50",
                )}
                size="sm"
                startContent={
                  <Icon
                    className={button.iconColor || ""}
                    icon={button.icon}
                    width={18}
                  />
                }
                variant="light"
              >
                {button.text}
              </Button>
            </DropdownTrigger>
          </Tooltip>
          <DropdownMenu
            aria-label={`${button.text} options`}
            onMouseEnter={showDropdown}
            onMouseLeave={unShowDropdown}
          >
            {button.dropdownItems.map((item) => (
              <DropdownItem
                key={item.key}
                className="py-2 px-3 hover:bg-default-100 rounded-md"
                textValue={item.text}
                onPress={item.onClick}
              >
                <div className="flex items-center space-x-2">
                  <Icon icon={item.icon} width={16} />
                  <span>{item.text}</span>
                </div>
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      );
    }

    // 普通按钮
    return (
      <Tooltip key={button.key} content={button.tooltip} delay={300}>
        <Button
          className={cn(
            "pl-2 pr-2 h-8 gap-1 text-default-600 transition-colors",
            button.className,
            "hover:bg-default-200/50",
          )}
          size="sm"
          startContent={
            <Icon
              className={button.iconColor || ""}
              icon={button.icon}
              width={18}
            />
          }
          variant="light"
          onPress={button.onClick}
        >
          {button.text}
        </Button>
      </Tooltip>
    );
  };

  // 更多菜单渲染
  const renderMoreMenu = () => {
    // 如果没有隐藏的按钮，不显示更多菜单
    if (hiddenButtons.length === 0) return null;

    return (
      <Dropdown
        classNames={{
          base: "before:bg-default-200",
          content: "min-w-[140px] p-1",
        }}
        isOpen={isMoreDropdownOpen}
        radius="sm"
      >
        <Tooltip content="更多操作" delay={300}>
          <DropdownTrigger
            onMouseEnter={showMoreDropdown}
            onMouseLeave={unShowMoreDropdown}
          >
            <Button
              className="pl-2 pr-2 h-8 gap-1 text-default-600 !min-w-16 hover:bg-default-200/50 transition-colors"
              startContent={<Icon icon="mingcute:more-2-fill" width={20} />}
              variant="light"
            >
              更多
            </Button>
          </DropdownTrigger>
        </Tooltip>
        <DropdownMenu
          aria-label="更多操作"
          onMouseEnter={showMoreDropdown}
          onMouseLeave={unShowMoreDropdown}
        >
          {hiddenButtons.map((item) => (
            <DropdownItem
              key={item.key}
              className="py-2 px-3 hover:bg-default-100 rounded-md"
              textValue={item.text}
              onPress={item.onClick}
            >
              <div className="flex items-center space-x-2">
                <Icon
                  icon={"isStatusButton" in item ? item.icon : item.icon}
                  width={16}
                />
                <span>{"text" in item ? item.text : ""}</span>
              </div>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    );
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
        {renderMoreMenu()}
      </div>
    </div>
  );
};

export default MonacoOperationBar;
