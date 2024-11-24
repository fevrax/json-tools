import type { Content } from 'vanilla-jsoneditor-cn'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useSettingsStore } from '~/stores/settings'

export interface MenuItem {
  id: string
  title: string
  editor: 'monaco' | 'vanilla'
  isPinned: boolean
  content?: string
  vanilla?: Content
  vanillaMode: VanillaMode
  editorInitMap: object
}

export enum Editor {
  Monaco = 'monaco',
  MonacoDiff = 'monaco-diff',
  Vanilla = 'vanilla',
}

export enum VanillaMode {
  Text = 'text',
  Tree = 'tree',
}

export const STORAGE_KEY = 'sidebar-store'

export const useSidebarStore = defineStore('sidebar', () => {
  const menuItems = ref<MenuItem[]>([])
  const activeId = ref<string>('')
  const nextId = ref<number>(0)
  const settingStore = useSettingsStore()

  watch([menuItems, activeId, nextId], () => {
    console.log('watch menuItems, activeId, nextId', settingStore.settings.editDataSaveLocal)
    saveToStorage()
  }, { deep: true })
  const activeTab = computed(() => {
    return menuItems.value.find(t => t.id === activeId.value)
  })

  // 初始化本地存储数据
  function initFromStorage() {
    if (!settingStore.settings.editDataSaveLocal)
      return

    console.log('initFromStorage')
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      menuItems.value = data.menuItems
      activeId.value = data.activeId
      nextId.value = data.nextId
    }
  }

  // 保存数据到本地存储
  function saveToStorage() {
    if (!settingStore.settings.editDataSaveLocal)
      return

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      menuItems: menuItems.value,
      activeId: activeId.value,
      nextId: nextId.value,
    }))
  }
  function addTab(title: string = '') {
    const id = `tab${++nextId.value}`
    title = title || `Tab${nextId.value}`
    const editorInitMap = {
      monaco: 0,
      monacoDiff: 0,
      vanilla: 0,
    }
    menuItems.value.push({ id, title, isPinned: false, content: '', editor: Editor.Monaco, vanillaMode: VanillaMode.Text, editorInitMap })
    activeId.value = id
  }

  function addTestTab() {
    const id = `menuItem-${++nextId.value}`
    menuItems.value.push({ id, title: 'Test Tab', isPinned: false, content: testJson, editor: Editor.Monaco, vanillaMode: VanillaMode.Text, editorInitMap })
    activeId.value = id
  }

  function updateTabContent(id: string, content: string) {
    const menuItem = menuItems.value.find(t => t.id === id)
    if (menuItem) {
      menuItem.content = content
    }
  }

  function updateCurrentTabContent(content: string) {
    if (activeTab.value) {
      activeTab.value.content = content
    }
  }

  function delTab(targetId: string) {
    const index = menuItems.value.findIndex(pane => pane.id === targetId)
    if (index === -1)
      return

    menuItems.value.splice(index, 1)

    if (activeId.value === targetId) {
      activeId.value = menuItems.value[Math.min(index, menuItems.value.length - 1)]?.id || ''
    }

    if (menuItems.value.length === 0) {
      addTab()
    }
  }

  function delAllTabs() {
    menuItems.value = []
    activeId.value = ''
    nextId.value = 0
  }

  function updateTabTitle(id: string, newTitle: string) {
    const menuItem = menuItems.value.find(t => t.id === id)
    if (menuItem) {
      menuItem.title = newTitle
    }
  }

  function updateCurrentMenuItem(item: MenuItem) {
    const index = menuItems.value.findIndex(t => t.id === item.id)
    if (index !== -1) {
      menuItems.value.splice(index, 1, item)
    }
  }

  function clearContent(id: string) {
    const menuItem = menuItems.value.find(t => t.id === id)
    if (menuItem) {
      menuItem.content = ''
    }
  }

  function closeLeftTabs(index: number) {
    const pinnedTabs = menuItems.value.slice(0, index).filter(tab => tab.isPinned)
    menuItems.value = [...pinnedTabs, ...menuItems.value.slice(index)]
    activeId.value = menuItems.value[0]?.id || ''
  }

  function closeRightTabs(index: number) {
    const pinnedTabs = menuItems.value.slice(index + 1).filter(tab => tab.isPinned)
    menuItems.value = [...menuItems.value.slice(0, index + 1), ...pinnedTabs]
    activeId.value = menuItems.value[index]?.id || ''
  }

  function closeOtherTabs(id: string) {
    const currentTab = menuItems.value.find(tab => tab.id === id)
    if (!currentTab)
      return
    const pinnedTabs = menuItems.value.filter(tab => tab.isPinned && tab.id !== id)
    menuItems.value = [...pinnedTabs, currentTab]
    activeId.value = currentTab.id
  }

  function closeAllTabs() {
    const pinnedTabs = menuItems.value.filter(tab => tab.isPinned)
    menuItems.value = pinnedTabs
    if (menuItems.value.length === 0) {
      addTab()
    } else {
      activeId.value = menuItems.value[0].id
    }
    nextId.value = 0
  }

  function togglePinTab(id: string) {
    const menuItem = menuItems.value.find(t => t.id === id)
    if (menuItem) {
      menuItem.isPinned = !menuItem.isPinned
    }
  }

  function changeEditor(id: string, editor: Editor) {
    const menuItem = menuItems.value.find(t => t.id === id)
    if (menuItem) {
      menuItem.editor = editor
    }
  }

  function vanilla2JsonContent() {
    if (!activeTab.value?.vanilla) {
      return undefined
    }
    if (activeTab.value.vanilla.json) {
      activeTab.value.content = JSON.stringify(activeTab.value.vanilla.json, null, 4)
    } else if (activeTab.value.vanilla.text) {
      activeTab.value.content = activeTab.value.vanilla.text ? activeTab.value.vanilla.text : ''
    }
  }

  function jsonContent2VanillaContent() {
    if (!activeTab.value?.content) {
      activeTab.value.vanilla = { json: '' }
      activeTab.value.vanillaMode = VanillaMode.Tree
      return undefined
    }
    try {
      activeTab.value.vanilla = { json: JSON.parse(activeTab.value.content) }
      activeTab.value.vanillaMode = VanillaMode.Tree
    } catch (e) {
      console.log('jsonContent2VanillaContent 解析失败', e)
    }
  }

  return {
    menuItems,
    activeId,
    nextId,
    activeTab,
    initFromStorage,
    saveToStorage,
    addTab,
    addTestTab,
    updateTabContent,
    updateCurrentTabContent,
    delTab,
    delAllTabs,
    updateTabTitle,
    updateCurrentMenuItem,
    clearContent,
    closeLeftTabs,
    closeRightTabs,
    closeOtherTabs,
    closeAllTabs,
    togglePinTab,
    changeEditor,
    vanilla2JsonContent,
    jsonContent2VanillaContent,
  }
})
