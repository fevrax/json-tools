import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";

import { MonacoDiffEditorEditorType } from "@/components/monacoEditor/monacoEntity";

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

interface DropdownButtonConfig extends BaseButtonConfig {
  hasDropdown: true;
  dropdownItems: {
    key: string;
    icon: string;
    text: string;
    onClick: () => void;
  }[];
}

type ButtonConfig = BaseButtonConfig | DropdownButtonConfig;

interface ButtonGroup {
  key: string;
  buttons: ButtonConfig[];
}

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

  // 容器参考和宽度状态
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleButtons, setVisibleButtons] = useState<string[]>([]);
  const [hiddenButtons, setHiddenButtons] = useState<ButtonConfig[]>([]);

  // 防止下拉菜单打开时，鼠标移开后立即关闭
  var copyDropdownOpenTimeoutRef: NodeJS.Timeout;
  var formatDropdownOpenTimeoutRef: NodeJS.Timeout;
  var sortDropdownOpenTimeoutRef: NodeJS.Timeout;
  var clearDropdownOpenTimeoutRef: NodeJS.Timeout;
  var moreDropdownOpenTimeoutRef: NodeJS.Timeout;

  const dropdownTimeout = 300;

  // 复制下拉菜单
  const showCopyDropdown = () => {
    if (copyDropdownOpenTimeoutRef) {
      clearTimeout(copyDropdownOpenTimeoutRef);
    }
    setCopyDropdownOpen(true);
  };
  const unShowCopyDropdown = () => {
    if (copyDropdownOpenTimeoutRef) {
      clearTimeout(copyDropdownOpenTimeoutRef);
    }
    copyDropdownOpenTimeoutRef = setTimeout(() => {
      setCopyDropdownOpen(false);
    }, dropdownTimeout);
  };

  // 格式化下拉菜单
  const showFormatDropdown = () => {
    if (formatDropdownOpenTimeoutRef) {
      clearTimeout(formatDropdownOpenTimeoutRef);
    }
    setFormatDropdownOpen(true);
  };
  const unShowFormatDropdown = () => {
    if (formatDropdownOpenTimeoutRef) {
      clearTimeout(formatDropdownOpenTimeoutRef);
    }
    formatDropdownOpenTimeoutRef = setTimeout(() => {
      setFormatDropdownOpen(false);
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

  // 清空下拉菜单
  const showClearDropdown = () => {
    if (clearDropdownOpenTimeoutRef) {
      clearTimeout(clearDropdownOpenTimeoutRef);
    }
    setClearDropdownOpen(true);
  };
  const unShowClearDropdown = () => {
    if (clearDropdownOpenTimeoutRef) {
      clearTimeout(clearDropdownOpenTimeoutRef);
    }
    clearDropdownOpenTimeoutRef = setTimeout(() => {
      setClearDropdownOpen(false);
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
            "text-sm text-default-600 px-3 rounded-xl bg-indigo-50/50 hover:bg-indigo-100/70",
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

      // 计算可用宽度 (考虑左右边距和一个分隔线)
      let availableWidth = width - 2 * MIN_PADDING - SEPARATOR_WIDTH;
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

    // 带下拉菜单的按钮
    if ("hasDropdown" in button && button.hasDropdown) {
      let isDropdownOpen = false;
      let setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>> | undefined;
      let showDropdown: (() => void) | undefined;
      let unShowDropdown: (() => void) | undefined;

      switch (button.key) {
        case "copy":
          isDropdownOpen = isCopyDropdownOpen;
          setDropdownOpen = setCopyDropdownOpen;
          showDropdown = showCopyDropdown;
          unShowDropdown = unShowCopyDropdown;
          break;
        case "format":
          isDropdownOpen = isFormatDropdownOpen;
          setDropdownOpen = setFormatDropdownOpen;
          showDropdown = showFormatDropdown;
          unShowDropdown = unShowFormatDropdown;
          break;
        case "sort":
          isDropdownOpen = isSortDropdownOpen;
          setDropdownOpen = setSortDropdownOpen;
          showDropdown = showSortDropdown;
          unShowDropdown = unShowSortDropdown;
          break;
        case "clear":
          isDropdownOpen = isClearDropdownOpen;
          setDropdownOpen = setClearDropdownOpen;
          showDropdown = showClearDropdown;
          unShowDropdown = unShowClearDropdown;
          break;
      }

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
          {hiddenButtons.flatMap((button) => {
            if ("hasDropdown" in button && button.hasDropdown) {
              // 处理带下拉的按钮，返回所有下拉项目的数组
              return button.dropdownItems.map((item) => (
                <DropdownItem
                  key={`${button.key}-${item.key}`}
                  className="py-2 px-3 hover:bg-default-100 rounded-md"
                  textValue={`${button.text} - ${item.text}`}
                  onPress={item.onClick}
                >
                  <div className="flex items-center space-x-2">
                    <Icon icon={item.icon} width={16} />
                    <span>{`${button.text} - ${item.text}`}</span>
                  </div>
                </DropdownItem>
              ));
            } else {
              // 处理普通按钮，返回单个按钮的数组
              return [
                <DropdownItem
                  key={button.key}
                  className="py-2 px-3 hover:bg-default-100 rounded-md"
                  textValue={button.text}
                  onPress={button.onClick}
                >
                  <div className="flex items-center space-x-2">
                    <Icon icon={button.icon} width={16} />
                    <span>{button.text}</span>
                  </div>
                </DropdownItem>
              ];
            }
          })}
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
      ) && <div className="h-6 w-px bg-default-200 mx-1" />}

      {/* 编辑按钮组 */}
      <div className="flex items-center gap-2">
        {actionGroups[1].buttons.map(renderButton)}

        {/* 更多菜单 */}
        {renderMoreMenu()}
      </div>
    </div>
  );
};

export default MonacoDiffOperationBar;
