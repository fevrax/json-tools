"use client";
import React, { useState } from "react";
import {
  Button,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
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
  ref?: React.RefObject<MonacoDiffOperationBarRef>;
}

export interface MonacoDiffOperationBarRef {}

const MonacoDiffOperationBar: React.FC<MonacoDiffOperationBarProps> = ({
  onCopy,
  onFormat,
  onClear,
  onFieldSort,
}) => {
  const [isCopyDropdownOpen, setCopyDropdownOpen] = useState(false);
  const [isFormatDropdownOpen, setFormatDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [isClearDropdownOpen, setClearDropdownOpen] = useState(false);

  // 防止下拉菜单打开时，鼠标移开后立即关闭
  const copyDropdownOpenTimeoutRef = React.useRef<NodeJS.Timeout>();
  const formatDropdownOpenTimeoutRef = React.useRef<NodeJS.Timeout>();
  const sortDropdownOpenTimeoutRef = React.useRef<NodeJS.Timeout>();
  const clearDropdownOpenTimeoutRef = React.useRef<NodeJS.Timeout>();

  const dropdownTimeout = 300;

  // 字段排序下拉菜单
  const showCopyDropdown = () => {
    clearTimeout(copyDropdownOpenTimeoutRef.current);
    setCopyDropdownOpen(true);
  };
  const unShowCopyDropdown = () => {
    clearTimeout(copyDropdownOpenTimeoutRef.current);
    copyDropdownOpenTimeoutRef.current = setTimeout(() => {
      setCopyDropdownOpen(false);
    }, dropdownTimeout);
  };

  // 格式化下拉菜单
  const showFormatDropdown = () => {
    clearTimeout(formatDropdownOpenTimeoutRef.current);
    setFormatDropdownOpen(true);
  };
  const unShowFormatDropdown = () => {
    clearTimeout(formatDropdownOpenTimeoutRef.current);
    formatDropdownOpenTimeoutRef.current = setTimeout(() => {
      setFormatDropdownOpen(false);
    }, dropdownTimeout);
  };

  // 字段排序下拉菜单
  const showSortDropdown = () => {
    clearTimeout(sortDropdownOpenTimeoutRef.current);
    setSortDropdownOpen(true);
  };
  const unShowSortDropdown = () => {
    clearTimeout(sortDropdownOpenTimeoutRef.current);
    sortDropdownOpenTimeoutRef.current = setTimeout(() => {
      setSortDropdownOpen(false);
    }, dropdownTimeout);
  };

  // 字段排序下拉菜单
  const showClearDropdown = () => {
    clearTimeout(clearDropdownOpenTimeoutRef.current);
    setClearDropdownOpen(true);
  };
  const unShowClearDropdown = () => {
    clearTimeout(clearDropdownOpenTimeoutRef.current);
    clearDropdownOpenTimeoutRef.current = setTimeout(() => {
      setClearDropdownOpen(false);
    }, dropdownTimeout);
  };

  return (
    <div className="h-10 flex items-center space-x-2 p-1 bg-default-100">
      {/* 复制按钮 */}
      <Dropdown
        classNames={{
          base: "before:bg-default-200", // change arrow background
          content: "min-w-[140px]",
        }}
        isOpen={isCopyDropdownOpen}
        radius="sm"
        // onOpenChange={setCopyDropdownOpen}
      >
        <DropdownTrigger
          onMouseEnter={showCopyDropdown}
          onMouseLeave={unShowCopyDropdown}
        >
          <Button
            className={cn("pl-1 pr-1 h-8 gap-1 text-default-600 !ml-2")}
            startContent={<Icon icon="si:copy-line" width={18} />}
            variant="light"
          >
            复制
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Copy options"
          onAction={(key) => {
            onCopy(key as MonacoDiffEditorEditorType);
            setCopyDropdownOpen(false);
          }}
          onMouseEnter={showCopyDropdown}
          onMouseLeave={unShowCopyDropdown}
        >
          <DropdownItem
            key={MonacoDiffEditorEditorType.left}
            textValue="复制左边"
          >
            <div className="flex items-center space-x-2">
              <Icon icon="mdi-light:arrow-left" width={18} />
              <span>复制左边</span>
            </div>
          </DropdownItem>
          <DropdownItem
            key={MonacoDiffEditorEditorType.right}
            textValue="复制左边"
          >
            <div className="flex items-center space-x-2">
              <Icon icon="mdi-light:arrow-right" width={18} />
              <span>复制右边</span>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <Dropdown
        classNames={{
          base: "before:bg-default-200", // change arrow background
          content: "min-w-[140px]",
        }}
        isOpen={isFormatDropdownOpen}
        radius="sm"
        // onOpenChange={setFormatDropdownOpen}
      >
        <DropdownTrigger
          onMouseEnter={showFormatDropdown}
          onMouseLeave={unShowFormatDropdown}
        >
          <Button
            className={cn("pl-0.5 pr-1 h-8 gap-1 text-default-600 !min-w-12")}
            startContent={<Icon icon="ph:magic-wand-light" width={18} />}
            variant="light"
          >
            格式化
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="format options"
          onAction={(key) => {
            if (key == MonacoDiffEditorEditorType.left) {
              onFormat(MonacoDiffEditorEditorType.left);
            } else if (key == MonacoDiffEditorEditorType.right) {
              onFormat(MonacoDiffEditorEditorType.right);
            } else if (key == MonacoDiffEditorEditorType.all) {
              onFormat(MonacoDiffEditorEditorType.all);
            }
            setFormatDropdownOpen(false);
          }}
          onMouseEnter={showFormatDropdown}
          onMouseLeave={unShowFormatDropdown}
        >
          <DropdownItem
            key={MonacoDiffEditorEditorType.all}
            textValue="格式化全部"
          >
            <div className="flex items-center space-x-2">
              <Icon icon="ph:magic-wand-light" width={18} />
              <span>格式化全部</span>
            </div>
          </DropdownItem>
          <DropdownItem
            key={MonacoDiffEditorEditorType.left}
            textValue="格式化左边"
          >
            <div className="flex items-center space-x-2">
              <Icon icon="mdi-light:arrow-left" width={18} />
              <span>格式化左边</span>
            </div>
          </DropdownItem>
          <DropdownItem
            key={MonacoDiffEditorEditorType.right}
            textValue="格式化右边"
          >
            <div className="flex items-center space-x-2">
              <Icon icon="mdi-light:arrow-right" width={18} />
              <span>格式化右边</span>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      {/* 字段排序下拉菜单 */}
      <Dropdown
        classNames={{
          base: "before:bg-default-200", // change arrow background
          content: "min-w-[140px]",
        }}
        isOpen={isSortDropdownOpen}
        radius="sm"
      >
        <DropdownTrigger
          onMouseEnter={showSortDropdown}
          onMouseLeave={unShowSortDropdown}
        >
          <Button
            className={cn("px-0.5  h-8 gap-1 text-default-600")}
            startContent={
              <Icon icon="fluent:arrow-sort-24-regular" width={18} />
            }
            variant="light"
          >
            字段排序
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Sort options"
          onAction={(key) => {
            switch (key) {
              case "left-asc":
                onFieldSort(MonacoDiffEditorEditorType.left, "asc");
                break;
              case "right-asc":
                onFieldSort(MonacoDiffEditorEditorType.right, "asc");
                break;
              case "left-desc":
                onFieldSort(MonacoDiffEditorEditorType.left, "desc");
                break;
              case "right-desc":
                onFieldSort(MonacoDiffEditorEditorType.right, "desc");
            }
            setSortDropdownOpen(false);
          }}
          onMouseEnter={showSortDropdown}
          onMouseLeave={unShowSortDropdown}
        >
          <DropdownItem key="left-asc" textValue="左边字段升序">
            <div className="flex items-center space-x-2">
              <Icon icon="mdi-light:arrow-left" width={18} />
              <span>左边字段升序</span>
            </div>
          </DropdownItem>
          <DropdownItem key="left-desc" textValue="左边字段降序">
            <div className="flex items-center space-x-2">
              <Icon icon="mdi-light:arrow-left" width={18} />
              <span>左边字段降序</span>
            </div>
          </DropdownItem>
          <DropdownItem key="right-asc" textValue="右边字段升序">
            <div className="flex items-center space-x-2">
              <Icon icon="mdi-light:arrow-right" width={18} />
              <span>右边字段升序</span>
            </div>
          </DropdownItem>
          <DropdownItem key="right-desc" textValue="右边字段降序">
            <div className="flex items-center space-x-2">
              <Icon icon="mdi-light:arrow-right" width={18} />
              <span>右边字段降序</span>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      {/* 清空按钮 */}
      <Dropdown
        classNames={{
          base: "before:bg-default-200", // change arrow background
          content: "min-w-[140px]",
        }}
        isOpen={isClearDropdownOpen}
        radius="sm"
      >
        <DropdownTrigger
          onMouseEnter={showClearDropdown}
          onMouseLeave={unShowClearDropdown}
        >
          <Button
            className={cn("pl-1 pr-1 h-8 gap-1 text-default-600")}
            startContent={<Icon icon="mynaui:trash" width={18} />}
            variant="light"
          >
            清空
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="clear options"
          onAction={(key) => {
            if (key == MonacoDiffEditorEditorType.left) {
              onClear(MonacoDiffEditorEditorType.left);
            } else if (key == MonacoDiffEditorEditorType.right) {
              onClear(MonacoDiffEditorEditorType.right);
            } else if (key == MonacoDiffEditorEditorType.all) {
              onClear(MonacoDiffEditorEditorType.all);
            }
            setClearDropdownOpen(false);
          }}
          onMouseEnter={showClearDropdown}
          onMouseLeave={unShowClearDropdown}
        >
          <DropdownItem
            key={MonacoDiffEditorEditorType.all}
            textValue="清空全部"
          >
            <div className="flex items-center space-x-2">
              <Icon icon="mynaui:trash" width={18} />
              <span>清空全部</span>
            </div>
          </DropdownItem>
          <DropdownItem
            key={MonacoDiffEditorEditorType.left}
            textValue="清空左边"
          >
            <div className="flex items-center space-x-2">
              <Icon icon="mdi-light:arrow-left" width={18} />
              <span>清空左边</span>
            </div>
          </DropdownItem>
          <DropdownItem
            key={MonacoDiffEditorEditorType.right}
            textValue="清空左边"
          >
            <div className="flex items-center space-x-2">
              <Icon icon="mdi-light:arrow-right" width={18} />
              <span>清空右边</span>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export default MonacoDiffOperationBar;
