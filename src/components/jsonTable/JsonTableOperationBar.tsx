import React, { useState } from "react";
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

import StatusButton, { IconStatus } from "@/components/button/StatusButton.tsx";
import toast from "@/utils/toast";

interface JsonTableOperationBarProps {
  onCopy: (type?: "default" | "node" | "path") => boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onCustomView: (key: "hideEmpty" | "hideNull" | "showAll") => void;
  onClear?: () => boolean;
  ref?: React.Ref<JsonTableOperationBarRef>;
}

export interface JsonTableOperationBarRef {}

const JsonTableOperationBar: React.FC<JsonTableOperationBarProps> = ({
  onCopy,
  onExpand,
  onCollapse,
  onCustomView,
  onClear,
}) => {
  const [isCopyDropdownOpen, setIsCopyDropdownOpen] = useState(false);
  const [isViewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<IconStatus>(IconStatus.Default);
  const [clearStatus, setClearStatus] = useState<IconStatus>(
    IconStatus.Default,
  );

  // 防止下拉菜单打开时，鼠标移开后立即关闭
  var viewDropdownOpenTimeoutRef: NodeJS.Timeout;

  const dropdownTimeout = 300;

  const handleCopy = (type?: "node" | "path") => {
    onCopy(type);
    setIsCopyDropdownOpen(false);
  };

  // 视图选项下拉菜单
  const showViewDropdown = () => {
    if (viewDropdownOpenTimeoutRef) {
      clearTimeout(viewDropdownOpenTimeoutRef);
    }
    setViewDropdownOpen(true);
  };
  const unShowViewDropdown = () => {
    if (viewDropdownOpenTimeoutRef) {
      clearTimeout(viewDropdownOpenTimeoutRef);
    }
    viewDropdownOpenTimeoutRef = setTimeout(() => {
      setViewDropdownOpen(false);
    }, dropdownTimeout);
  };

  return (
    <div className="h-10 flex items-center space-x-2 p-1 bg-default-100">
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
                case "node":
                  handleCopy("node");
                  break;
                case "path":
                  handleCopy("path");
                  break;
              }
            }}
          >
            <DropdownItem key="node" textValue="复制节点">
              <div className="flex items-center space-x-2">
                <Icon icon="hugeicons:node-edit" width={16} />
                <span>复制节点</span>
              </div>
            </DropdownItem>
            <DropdownItem key="path" textValue="复制路径">
              <div className="flex items-center space-x-2">
                <Icon icon="lsicon:path-filled" width={16} />
                <span>复制路径</span>
              </div>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </ButtonGroup>

      {/*/!* 过滤按钮 *!/*/}
      {/*<Button*/}
      {/*  className="text-sm text-default-600 px-2"*/}
      {/*  size="sm"*/}
      {/*  startContent={<Icon icon="solar:filter-linear" width={18} />}*/}
      {/*  title="过滤"*/}
      {/*  variant="light"*/}
      {/*  onPress={onFilter}*/}
      {/*>*/}
      {/*  过滤*/}
      {/*</Button>*/}

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

      {/* 清空按钮 */}
      {onClear && (
        <StatusButton
          icon="mynaui:trash"
          status={clearStatus}
          successText="已清空"
          text="清空"
          onClick={() => {
            setTimeout(() => {
              setClearStatus(IconStatus.Default);
            }, 1000);
            setClearStatus(onClear() ? IconStatus.Success : IconStatus.Error);
          }}
        />
      )}
    </div>
  );
};

export default JsonTableOperationBar;
