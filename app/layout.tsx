"use client";

import "@/styles/globals.css";
import clsx from "clsx";
import {
  Image,
  Button,
  cn,
  Spacer,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import React from "react";
import { usePathname, useRouter } from "next/navigation";

import { Providers } from "./providers";

import SidebarDrawer from "@/components/sidebar/sidebar-drawer";
import Sidebar from "@/components/sidebar/sidebar";
import { items } from "@/components/sidebar/items";
import { ThemeSwitch } from "@/components/theme-switch";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { isOpen, onOpenChange } = useDisclosure();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const pathname = usePathname();

  const handleSelect = (
    key: string | React.SyntheticEvent<HTMLUListElement>,
  ) => {
    console.log("handleSelect", key);
    if (pathname !== "/") {
      router.push("/");
    }
    // 其他逻辑...
  };

  const onToggle = React.useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <html suppressHydrationWarning lang="zh">
      <head>
        <title>JSON Tools - 多功能JSON处理助手</title>
        <meta content="JSON Tools - 多功能JSON处理助手" name="description" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <link href="/favicon.png" rel="icon" />
      </head>
      <body
        className={clsx("min-h-screen bg-background font-sans antialiased")}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div className="relative flex h-dvh w-full">
            {/* Sidebar */}
            <SidebarDrawer
              className={cn("shrink-0", {
                "w-[56px]": isCollapsed,
                "w-[170px]": !isCollapsed,
              })}
              hideCloseButton={true}
              isOpen={isOpen}
              onOpenChange={onOpenChange}
            >
              <div
                className={cn(
                  "will-change relative flex h-full flex-col bg-default-100 py-4 px-2 transition-width",
                  {
                    "items-center px-[6px] py-4": isCollapsed,
                  },
                )}
                style={{ width: isCollapsed ? 56 : 170 }}
              >
                <div
                  className={cn(
                    "w-full flex items-center justify-between gap-3 pl-4 pr-4",
                    {
                      "justify-center gap-0 px-0": isCollapsed,
                    },
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full",
                    )}
                  >
                    <Image className="h-9 w-9 rounded-fulll" src="./logo.png" />
                  </div>

                  <div className={cn("flex-end flex", { hidden: isCollapsed })}>
                    <Icon
                      className="cursor-pointer dark:text-primary-foreground/60 [&>g]:stroke-[1px]"
                      icon="solar:round-alt-arrow-left-line-duotone"
                      width={28}
                      onClick={onToggle}
                    />
                  </div>
                </div>
                <Spacer y={4} />

                {/* 菜单项*/}
                <Sidebar
                  defaultSelectedKey="textView"
                  iconClassName="group-data-[selected=true]:text-default-50"
                  isCompact={isCollapsed}
                  itemClasses={{
                    base: "px-3 rounded-large data-[selected=true]:!bg-foreground",
                    title: "group-data-[selected=true]:text-default-50",
                  }}
                  items={items}
                  onSelect={handleSelect}
                />

                <Spacer y={8} />

                <div
                  className={cn("mt-auto flex flex-col", {
                    "items-center": isCollapsed,
                  })}
                >
                  {isCollapsed && (
                    <Tooltip
                      content="展开菜单"
                      isDisabled={!isCollapsed}
                      placement="right"
                    >
                      <Button
                        isIconOnly
                        aria-label="展开菜单"
                        className="flex h-10 w-10 text-default-600"
                        size="sm"
                        variant="light"
                      >
                        <Icon
                          className="cursor-pointer dark:text-primary-foreground/60 [&>g]:stroke-[1px]"
                          height={24}
                          icon="solar:round-alt-arrow-right-line-duotone"
                          width={24}
                          onClick={onToggle}
                        />
                      </Button>
                    </Tooltip>
                  )}

                  {/* 主题切换 */}
                  <ThemeSwitch isCollapsed={isCollapsed} />
                  <Tooltip
                    content="更多设置"
                    isDisabled={!isCollapsed}
                    placement="right"
                  >
                    <Button
                      aria-label="更多设置"
                      className={cn(
                        "justify-start text-default-500 data-[hover=true]:text-foreground",
                        {
                          "justify-center": isCollapsed,
                        },
                      )}
                      isIconOnly={isCollapsed}
                      startContent={
                        isCollapsed ? null : (
                          <Icon
                            className="flex-none rotate-180 text-default-500"
                            icon="solar:settings-outline"
                            width={24}
                          />
                        )
                      }
                      variant="light"
                      onClick={() => {
                        router.push("/settings");
                      }}
                    >
                      {isCollapsed ? (
                        <Icon
                          className="rotate-180 text-default-500"
                          icon="solar:settings-outline"
                          width={24}
                        />
                      ) : (
                        "更多设置"
                      )}
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </SidebarDrawer>

            {/*  Settings Content */}
            <div className="flex-1 overflow-auto pr-1 min-w-16">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
