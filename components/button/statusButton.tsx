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
  size?: "xs" | "sm" | "md" | "lg";
  onClick: () => void;
  endContent?: React.ReactNode;
}

const StatusButton = forwardRef<HTMLButtonElement, StatusButtonProps>(
  (
    {
      text,
      successText,
      status,
      icon,
      iconSize = 18,
      size = "xs",
      onClick,
      endContent,
    },
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
        className={cn("px-0.5 gap-1 text-default-600", {
          "text-green-500": status === IconStatus.Success,
          "text-red-500": status === IconStatus.Error,
          "h-7": size === "xs",
        })}
        endContent={endContent}
        size={size === "xs" ? "sm" : size}
        startContent={renderIcon()}
        variant="light"
        onPress={onClick}
      >
        {status === IconStatus.Success && successText ? successText : text}
      </Button>
    );
  },
);

StatusButton.displayName = "StatusButton";
export default StatusButton;
