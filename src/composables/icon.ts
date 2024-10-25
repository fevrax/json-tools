import type { IconProps } from '@iconify/vue'
import { Icon } from '@iconify/vue'
import Iconify from '~/components/Iconify.vue'

export function renderIcon(icon: string) {
  return () => h(Icon, { icon })
}

export function renderIconOption(option: IconProps) {
  return () => h(Icon, option)
}

export function renderIconFontSize(icon: string, size: number) {
  return () => h(Icon, { icon, style: { fontSize: size } })
}

// 渲染 Iconify 组件
export function renderIconifyFontSize(icon: string, size: number) {
  return () => h(Iconify, { icon, style: { fontSize: size }, inline: true })
}

// 渲染 Iconify 组件
export function renderIconifyFontSizeH(icon: string, size: number) {
  return h(Iconify, { icon, style: { fontSize: size }, inline: true })
}
