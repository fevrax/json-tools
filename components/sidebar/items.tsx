import {Chip} from "@nextui-org/react";
import {Icon} from "@iconify/react";

import {type SidebarItem} from "./sidebar";

/**
 * Please check the https://nextui.org/docs/guide/routing to have a seamless router integration
 */

export const items: SidebarItem[] = [
  {
    key: "textView",
    href: "#",
    icon: "solar:home-2-linear",
    title: "文本视图",
  },
  {
    key: "treeView",
    href: "#treeView",
    icon: "solar:widget-2-outline",
    title: "树形视图",
  },
  {
    key: "diffView",
    href: "#diffView",
    icon: "solar:checklist-minimalistic-outline",
    title: "DIFF视图",
  }
];
