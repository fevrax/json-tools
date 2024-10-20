import {NIcon} from "naive-ui";

export * from './dark'


// renderIcon 渲染图标
// ionicons5
// https://www.xicons.org/#/
export function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}
