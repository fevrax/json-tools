import React, { useState } from "react";
import {
  Button,
  ButtonGroup,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import { Icon } from "@iconify/react";

import StatusButton, { IconStatus } from "@/components/button/statusButton";

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
  const [copyStatus, setCopyStatus] = useState<IconStatus>(IconStatus.Default);
  const [formatStatus, setformatStatus] = useState<IconStatus>(IconStatus.Default);
  const [clearStatus, setClearStatus] = useState<IconStatus>(IconStatus.Default);

  const handleCopy = (type?: "compress" | "escape") => {
    // onCopy(type);
    setIsDropdownOpen(false);
  };

  return (
    <div className="h-10 flex items-center space-x-2 p-1 bg-default-50">
      <ButtonGroup className="ml-3" size="sm" variant="light">
        <StatusButton
          icon="si:copy-line"
          status={copyStatus}
          text="复制"
          onClick={() => setCopyStatus(IconStatus.Error)}
        />

        <Dropdown isOpen={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownTrigger>
            <Button
              isIconOnly
              className="px-0"
              startContent={<Icon icon="formkit:down" width={20} />}
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
            <DropdownItem key="compress">
              <div className="flex items-center space-x-2">
                <Icon icon="f7:rectangle-compress-vertical" width={20} />
                <span>压缩后复制</span>
              </div>
            </DropdownItem>
            <DropdownItem key="escape">
              <div className="flex items-center space-x-2">
                <Icon icon="si:swap-horiz-line" width={20} />
                <span>转义后复制</span>
              </div>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </ButtonGroup>

      <StatusButton
        icon="mdi:magic"
        status={formatStatus}
        text="格式化"
        onClick={() => setCopyStatus(IconStatus.Error)}
      />


      <StatusButton
        icon="mynaui:trash"
        status={clearStatus}
        text="清空"
        onClick={() => setCopyStatus(IconStatus.Error)}
      />
    </div>
  );
};

export default MonacoOperationBar;
