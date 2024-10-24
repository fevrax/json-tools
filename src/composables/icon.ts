import type { IconProps } from '@iconify/vue'
import { Icon } from '@iconify/vue'

export function renderIcon(icon: string) {
  return () => h(Icon, { icon })
}

export function renderIconOption(option: IconProps) {
  return () => h(Icon, option)
}

export function renderIconFontSize(icon: string, size: number) {
  return () => h(Icon, { icon, style: { fontSize: size } })
}

