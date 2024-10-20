
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import enUS from 'ant-design-vue/es/locale/en_US';
export const locale = enUS

export const toggleLocale = (language: string) => {
  switch (language) {
    case 'zh':
      locale.value = zhCN
      break
    case 'en':
      locale.value = enUS
      break
  }
}
