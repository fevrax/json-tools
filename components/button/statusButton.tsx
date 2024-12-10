import React, { forwardRef } from "react";
import { Button, cn } from "@nextui-org/react";
import { Icon } from "@iconify/react";

export enum IconStatus {
  Default = "default",
  Success = "success",
  Loading = "loading",
  Error = "error",
}

export interface StatusButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  successText?: string;
  status: IconStatus;
  icon: string;
  iconSize?: number;
  className?: string;
  onClick: () => void;
  endContent?: React.ReactNode;
}

const StatusButton = forwardRef<HTMLButtonElement, StatusButtonProps>(
  (
    { text, successText, status, icon, iconSize = 20, onClick, endContent, className },
    ref,
  ) => {
    const renderIcon = () => {
      switch (status) {
        case IconStatus.Success:
          return <Icon icon="icon-park-solid:success" width={iconSize} />;
        case IconStatus.Error:
          return <Icon icon="humbleicons:times" width={iconSize} />;
        default:
          return <Icon icon={icon} width={iconSize} />;
      }
    };

    return (
      <Button
        className={cn("px-1 gap-2 text-default-600 h-8", {
          "text-green-500": status === IconStatus.Success,
          "text-red-500": status === IconStatus.Error,
        }, className)}
        endContent={endContent}
        startContent={renderIcon()}
        variant="light"
        onClick={onClick}
      >
        {status === IconStatus.Success && successText ? successText : text}
      </Button>
    );
  },
);

StatusButton.displayName = "StatusButton";
export default StatusButton;
