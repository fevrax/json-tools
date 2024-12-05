import React, { useState } from "react";
import {
  Button,
  ButtonGroup,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import { Icon } from "@iconify/react";

import StatusButton, { IconStatus } from "@/components/button/statusButton";

interface OperationBarProps {
  onCopy: (type?: "default" | "compress" | "escape") => void;
  onFormat: () => void;
  onClear: () => void;
  content?: string;
}

const MonacoOperationBar: React.FC<OperationBarProps> = ({
  onCopy,
  onFormat,
  onClear,
}) => {
  const [isCopyDropdownOpen, setisCopyDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<IconStatus>(IconStatus.Default);
  const [formatStatus, setformatStatus] = useState<IconStatus>(
    IconStatus.Default,
  );
  const [clearStatus, setClearStatus] = useState<IconStatus>(
    IconStatus.Default,
  );

  const handleCopy = (type?: "compress" | "escape") => {
    onCopy(type);
    setisCopyDropdownOpen(false);
  };

  return (
    <div className="h-8 flex items-center space-x-2 p-1 bg-default-100 mb-1">
      <ButtonGroup className="ml-3" size="sm" variant="light">
        <StatusButton
          icon="si:copy-line"
          status={copyStatus}
          text="复制"
          onClick={() => onCopy("default")}
        />

        <Dropdown
          classNames={{
            base: "before:bg-default-200", // change arrow background
            content: "min-w-[140px]",
          }}
          isOpen={isCopyDropdownOpen}
          radius="sm"
          onOpenChange={setisCopyDropdownOpen}
        >
          <DropdownTrigger>
            <Button
              isIconOnly
              className="p-0 m-0 min-w-[0px] w-auto"
              startContent={<Icon icon="formkit:down" width={18} />}
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
              <div className="flex items-center space-x-2 text-xs">
                <Icon icon="f7:rectangle-compress-vertical" width={16} />
                <span>压缩后复制</span>
              </div>
            </DropdownItem>
            <DropdownItem key="escape" textValue="转义后复制">
              <div className="flex items-center space-x-2 text-xs">
                <Icon icon="si:swap-horiz-line" width={16} />
                <span>转义后复制</span>
              </div>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </ButtonGroup>

      <StatusButton
        icon="ph:magic-wand-light"
        status={formatStatus}
        text="格式化"
        onClick={onFormat}
      />

      <Dropdown
        classNames={{
          base: "before:bg-default-200", // change arrow background
          content: "min-w-[140px]",
        }}
        isOpen={isSortDropdownOpen}
        radius="sm"
        onOpenChange={setSortDropdownOpen}
      >
        <DropdownTrigger>
          <Button
            className={cn("px-0.5  h-7 gap-1 text-default-600")}
            size="sm"
            startContent={
              <Icon icon="fluent:arrow-sort-24-regular" width={18} />
            }
            variant="light"
            onClick={() => setSortDropdownOpen(true)}
            onMouseEnter={() => setSortDropdownOpen(true)}
          >
            字段排序
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Sort options"
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
          <DropdownItem key="asc" textValue="字段升序">
            <div className="flex items-center space-x-2 text-xs">
              <Icon icon="f7:rectangle-compress-vertical" width={16} />
              <span>字段升序</span>
            </div>
          </DropdownItem>
          <DropdownItem key="desc" textValue="字段降序">
            <div className="flex items-center space-x-2 text-xs">
              <Icon icon="si:swap-horiz-line" width={16} />
              <span>字段降序</span>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <StatusButton
        icon="mynaui:trash"
        status={clearStatus}
        text="清空"
        onClick={onClear}
      />
    </div>
  );
};

export default MonacoOperationBar;
