import React, { FC } from "react";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import { SwitchProps, useSwitch } from "@nextui-org/switch";
import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";
import clsx from "clsx";
import { Button, cn } from "@nextui-org/react";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
  classNames?: SwitchProps["classNames"];
  isCollapsed?: boolean;
  switchTheme?: () => void;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({
  className,
  classNames,
  isCollapsed,
}) => {
  const { theme, setTheme } = useTheme();
  const isSSR = useIsSSR();

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";

    setTheme(newTheme);
  };

  const { Component, isSelected, getBaseProps, getInputProps } = useSwitch({
    isSelected: theme === "light" || isSSR,
    "aria-label": `Switch to ${theme === "light" || isSSR ? "dark" : "light"} mode`,
    onChange: toggleTheme,
  });

  return (
    <Component
      {...getBaseProps({
        className: clsx(
          "px-px transition-opacity hover:opacity-80 cursor-pointer w-full",
          className,
          classNames?.base,
        ),
      })}
    >
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <div className={"w-60"}>
        {!isSelected || isSSR ? (
          <Button
            aria-label="日间模式"
            className={cn(
              "justify-start text-default-500 data-[hover=true]:text-foreground w-full",
              {
                "justify-center": isCollapsed,
              },
            )}
            isIconOnly={isCollapsed}
            startContent={isCollapsed ? null : <SunFilledIcon size={24} />}
            variant="light"
            onPress={toggleTheme}
          >
            {isCollapsed ? <SunFilledIcon size={24} /> : "日间模式"}
          </Button>
        ) : (
          <Button
            aria-label="夜间模式"
            className={cn(
              "justify-start text-default-500 data-[hover=true]:text-foreground w-full",
              {
                "justify-center": isCollapsed,
              },
            )}
            isIconOnly={isCollapsed}
            startContent={isCollapsed ? null : <MoonFilledIcon size={24} />}
            variant="light"
            onPress={toggleTheme}
          >
            {isCollapsed ? <MoonFilledIcon size={24} /> : "夜间模式"}
          </Button>
        )}
      </div>
    </Component>
  );
};
