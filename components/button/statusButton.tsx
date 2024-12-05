import React from "react";
import { Button, cn } from "@nextui-org/react";
import { Icon } from "@iconify/react";

export enum IconStatus {
  Default = "default",
  Success = "success",
  Loading = "loading",
  Error = "error",
}

export interface StatusButtonProps {
  text: string;
  status: IconStatus;
  icon: string;
  size?: "sm" | "md" | "lg";
  onClick: () => void;
}

const StatusButton: React.FC<StatusButtonProps> = ({
  text,
  status,
  icon,
  size = "sm",
  onClick,
}) => {
  const renderIcon = () => {
    switch (status) {
      case IconStatus.Success:
        return <Icon icon="icon-park-solid:success" width={20} />;
      case IconStatus.Error:
        return <Icon icon="humbleicons:times" width={20} />;
      default:
        return <Icon icon={icon} width={20} />;
    }
  };

  return (
    <Button
      className={cn("px-1", {
        "text-green-500": status === IconStatus.Success,
        "text-red-500": status === IconStatus.Error,
      })}
      size={size}
      startContent={renderIcon()}
      variant="light"
      onClick={onClick}
    >
      {text}
    </Button>
  );
};

export default StatusButton;
