import React, { useState } from "react";
import {
  Button,
  ButtonGroup,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { Icon } from "@iconify/react";

interface OperationBarProps {
  onCopy?: (type?: "compress" | "escape") => void;
  onFormat?: () => void;
  onClear?: () => void;
  content?: string;
}

const MonacoOperationBar: React.FC<OperationBarProps> = ({
  onCopy,
  onFormat,
  onClear,
  content,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCopy = (type?: "compress" | "escape") => {
    // onCopy(type);
    setIsDropdownOpen(false);
  };

  return (
    <div className="h-10flex items-center space-x-2 p-1 bg-default-100 rounded-lg">
      <ButtonGroup size="sm" variant="light">
        <Button
          className="px-2"
          startContent={<Icon icon="solar:copy-outline" width={20} />}
        >
          复制
        </Button>
        <Dropdown isOpen={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownTrigger>
            <Button
              isIconOnly
              className="px-2"
              startContent={<Icon icon="solar:copy-outline" width={20} />}
            />
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Copy options"
            onAction={(key) => {
              switch (key) {
                case "normal":
                  handleCopy();
                  break;
                case "compress":
                  handleCopy("compress");
                  break;
                case "escape":
                  handleCopy("escape");
                  break;
              }
            }}
          >
            <DropdownItem key="normal">普通复制</DropdownItem>
            <DropdownItem key="compress">压缩复制</DropdownItem>
            <DropdownItem key="escape">转义复制</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </ButtonGroup>

      <Button
        size="sm"
        startContent={<Icon icon="solar:copy-outline" width={20} />}
        variant="light"
        onClick={onFormat}
      >
        格式化
      </Button>

      <Button
        size="sm"
        startContent={<Icon icon="solar:copy-outline" width={20} />}
        variant="light"
        onClick={onClear}
      >
        清空
      </Button>
    </div>
  );
};

export default MonacoOperationBar;
