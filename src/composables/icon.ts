import IconFont from '~/components/IconFont.vue'

export function renderIcon(type: string) {
  return () => h(IconFont, { type })
}
