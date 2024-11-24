// stores/settings.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface SettingsState {
  darkMode: boolean
  editorCDN: 'false' | 'true'
  fontSize: 'small' | 'medium' | 'large'
  expandTabs: boolean // 是否展开tab
  editDataSaveLocal: boolean // 是否保存编辑数据到本地
}

export const useSettingsStore = defineStore('settings', () => {
  const defaultSettings: SettingsStatex = {
    darkMode: useDark().value,
    editorCDN: 'false',
    fontSize: 'medium',
    expandTabs: true,
    editDataSaveLocal: true,
  }

  const settings = ref<SettingsState>(
    JSON.parse(localStorage.getItem('plugin-settings') || JSON.stringify(defaultSettings)),
  )

  watch(settings, (newSettings) => {
    useToggle(useDark())(newSettings.darkMode)
    localStorage.setItem('plugin-settings', JSON.stringify(newSettings))
  }, { deep: true })

  function updateSetting<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    settings.value[key] = value
  }
  function toggleDark(darkMode: boolean) {
    settings.value.darkMode = darkMode
  }
  return {
    defaultSettings,
    settings,
    updateSetting,
    toggleDark,
  }
})
