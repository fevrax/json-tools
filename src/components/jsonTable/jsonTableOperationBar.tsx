import React, { Key, useState } from "react";
import {
  Button,
  ButtonGroup,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { Icon } from "@iconify/react";

import StatusButton, { IconStatus } from "../button/statusButton";

import toast from "@/utils/toast";

interface JsonTableOperationBarProps {
  onCopy: (type?: "default" | "compress" | "escape") => boolean;
  onFilter: () => void;
  onSearch: () => void;
  onExport: (type: "csv" | "excel") => boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onCustomView: (key: "hideEmpty" | "hideNull" | "showAll") => void;
  ref?: React.RefObject<JsonTableOperationBarRef>;
}

export interface JsonTableOperationBarRef {}

const JsonTableOperationBar: React.FC<JsonTableOperationBarProps> = ({
  onCopy,
  onFilter,
  onSearch,
  onExport,
  onExpand,
  onCollapse,
  onCustomView,
}) => {
  const [isCopyDropdownOpen, setIsCopyDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [isViewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<IconStatus>(IconStatus.Default);

  // 防止下拉菜单打开时，鼠标移开后立即关闭
  const exportDropdownOpenTimeoutRef = React.useRef<NodeJS.Timeout>();
  const viewDropdownOpenTimeoutRef = React.useRef<NodeJS.Timeout>();

  const dropdownTimeout = 300;

  const handleCopy = (type?: "compress" | "escape") => {
    onCopy(type);
    setIsCopyDropdownOpen(false);
  };

  // 导出下拉菜单
  const showExportDropdown = () => {
    clearTimeout(exportDropdownOpenTimeoutRef.current);
    setExportDropdownOpen(true);
  };
  const unShowExportDropdown = () => {
    clearTimeout(exportDropdownOpenTimeoutRef.current);
    exportDropdownOpenTimeoutRef.current = setTimeout(() => {
      setExportDropdownOpen(false);
    }, dropdownTimeout);
  };

  // 视图选项下拉菜单
  const showViewDropdown = () => {
    clearTimeout(viewDropdownOpenTimeoutRef.current);
    setViewDropdownOpen(true);
  };
  const unShowViewDropdown = () => {
    clearTimeout(viewDropdownOpenTimeoutRef.current);
    viewDropdownOpenTimeoutRef.current = setTimeout(() => {
      setViewDropdownOpen(false);
    }, dropdownTimeout);
  };

  return (
    <div className="h-10 flex items-center space-x-2 p-1 bg-default-100">
      {/* 搜索按钮 */}
      <Button
        className="text-sm text-default-600 px-2 rounded-xl"
        size="sm"
        startContent={<Icon icon="uil:search" width={18} />}
        title="搜索"
        variant="light"
        onPress={onSearch}
      >
        搜索
      </Button>

      {/* 复制按钮组 */}
      <ButtonGroup className="" variant="light">
        <StatusButton
          icon="si:copy-line"
          status={copyStatus}
          successText="已复制"
          text="复制"
          onClick={() => {
            setTimeout(() => {
              setCopyStatus(IconStatus.Default);
            }, 1000);
            setCopyStatus(onCopy() ? IconStatus.Success : IconStatus.Error);
          }}
        />

        <Dropdown
          classNames={{
            base: "before:bg-default-200", // change arrow background
            content: "min-w-[140px]",
          }}
          isOpen={isCopyDropdownOpen}
          radius="sm"
          onOpenChange={setIsCopyDropdownOpen}
        >
          <DropdownTrigger>
            <Button
              isIconOnly
              className="p-0 m-0 min-w-[22px] w-auto"
              startContent={<Icon icon="formkit:down" width={16} />}
            />
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Copy options"
            onAction={(key) => {
              switch (key) {
                case "compress":
                  handleCopy("compress");
                  break;
                case "escape":
                  handleCopy("escape");
                  break;
              }
            }}
          >
            <DropdownItem key="compress" textValue="压缩后复制">
              <div className="flex items-center space-x-2">
                <Icon icon="f7:rectangle-compress-vertical" width={16} />
                <span>压缩后复制</span>
              </div>
            </DropdownItem>
            <DropdownItem key="escape" textValue="转义后复制">
              <div className="flex items-center space-x-2">
                <Icon icon="si:swap-horiz-line" width={16} />
                <span>转义后复制</span>
              </div>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </ButtonGroup>

      {/* 过滤按钮 */}
      <Button
        className="text-sm text-default-600 px-2"
        size="sm"
        startContent={<Icon icon="solar:filter-linear" width={18} />}
        title="过滤"
        variant="light"
        onPress={onFilter}
      >
        过滤
      </Button>

      {/* 展开/折叠按钮 */}
      <ButtonGroup className="" variant="light">
        <Button
          className="text-sm text-default-600 px-2"
          size="sm"
          startContent={<Icon icon="tabler:fold-down" width={18} />}
          title="展开所有"
          onPress={onExpand}
        >
          展开
        </Button>
        <Button
          className="text-sm text-default-600 px-2"
          size="sm"
          startContent={<Icon icon="tabler:fold-up" width={18} />}
          title="折叠所有"
          onPress={onCollapse}
        >
          折叠
        </Button>
      </ButtonGroup>

      {/* 导出下拉菜单 */}
      <Dropdown
        classNames={{
          base: "before:bg-default-200", // change arrow background
          content: "min-w-[140px]",
        }}
        isOpen={isExportDropdownOpen}
        radius="sm"
      >
        <DropdownTrigger
          onMouseEnter={showExportDropdown}
          onMouseLeave={unShowExportDropdown}
        >
          <Button
            className={cn("pl-2 pr-1 h-8 gap-1 text-default-600")}
            startContent={<Icon icon="solar:export-line-duotone" width={16} />}
            variant="light"
          >
            导出
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Export options"
          onAction={(key) => {
            switch (key) {
              case "csv":
                if (onExport("csv")) {
                  toast.success("已导出为CSV文件");
                }
                break;
              case "excel":
                if (onExport("excel")) {
                  toast.success("已导出为Excel文件");
                }
                break;
            }
            setExportDropdownOpen(false);
          }}
          onMouseEnter={showExportDropdown}
          onMouseLeave={unShowExportDropdown}
        >
          <DropdownItem key="csv" textValue="导出为CSV">
            <div className="flex items-center space-x-2">
              <Icon icon="vscode-icons:file-type-csv" width={16} />
              <span>导出为CSV</span>
            </div>
          </DropdownItem>
          <DropdownItem key="excel" textValue="导出为Excel">
            <div className="flex items-center space-x-2">
              <Icon icon="vscode-icons:file-type-excel" width={16} />
              <span>导出为Excel</span>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      {/* 视图选项下拉菜单 */}
      <Dropdown
        classNames={{
          base: "before:bg-default-200", // change arrow background
          content: "min-w-[140px]",
        }}
        isOpen={isViewDropdownOpen}
        radius="sm"
      >
        <DropdownTrigger
          onMouseEnter={showViewDropdown}
          onMouseLeave={unShowViewDropdown}
        >
          <Button
            className={cn("pl-2 pr-1 h-8 gap-1 text-default-600")}
            startContent={<Icon icon="solar:eye-outline" width={16} />}
            variant="light"
          >
            视图
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="View options"
          onAction={(key) => {
            switch (key) {
              case "hideEmpty":
                onCustomView("hideEmpty");
                toast.success("已隐藏空值");
                break;
              case "hideNull":
                onCustomView("hideNull");
                toast.success("已隐藏null值");
                break;
              case "showAll":
                onCustomView("showAll");
                toast.success("显示所有值");
                break;
            }
            setViewDropdownOpen(false);
          }}
          onMouseEnter={showViewDropdown}
          onMouseLeave={unShowViewDropdown}
        >
          <DropdownItem key="hideEmpty" textValue="隐藏空值">
            <div className="flex items-center space-x-2">
              <Icon icon="solar:eye-closed-outline" width={16} />
              <span>隐藏空值</span>
            </div>
          </DropdownItem>
          <DropdownItem key="hideNull" textValue="隐藏null值">
            <div className="flex items-center space-x-2">
              <Icon icon="solar:eye-closed-outline" width={16} />
              <span>隐藏null值</span>
            </div>
          </DropdownItem>
          <DropdownItem key="showAll" textValue="显示所有值">
            <div className="flex items-center space-x-2">
              <Icon icon="solar:eye-outline" width={16} />
              <span>显示所有值</span>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export default JsonTableOperationBar; 