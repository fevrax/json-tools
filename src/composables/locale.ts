import enUS from 'ant-design-vue/es/locale/en_US'
import zhCN from 'ant-design-vue/es/locale/zh_CN'

export const locale = enUS

export function toggleLocale(language: string) {
  switch (language) {
    case 'zh':
      locale.value = zhCN
      break
    case 'en':
      locale.value = enUS
      break
  }
}
