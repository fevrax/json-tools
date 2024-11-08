import type { Content } from 'vanilla-jsoneditor-cn'
import { defineStore } from 'pinia'

export interface MenuItem {
  id: string
  title: string
  editor: 'monaco' | 'vanilla'
  isPinned: boolean
  content?: string
  vanilla?: Content
  vanillaMode: VanillaMode
}

export enum Editor {
  Monaco = 'monaco',
  Vanilla = 'vanilla',
}
export enum VanillaMode {
  Text = 'text',
  Tree = 'tree',
}

export const useSidebarStore = defineStore('sidebar', {
  state: () => ({
    menuItems: [] as MenuItem[],
    activeId: '',
    nextId: 0,
  }),
  getters: {
    activeTab(): MenuItem | undefined {
      return this.menuItems.find(t => t.id === this.activeId)
    },
  },
  actions: {
    addTab(title: string = '') {
      const id = `tab${++this.nextId}`
      title = title || `Tab${this.nextId}`
      this.menuItems.push({ id, title, isPinned: false, content: '', editor: Editor.Monaco, vanillaMode: VanillaMode.Text })
      this.activeId = id
    },
    addTestTab() {
      const id = `menuItem-${++this.nextId}`
      this.menuItems.push({ id, title: 'Test Tab', isPinned: false, content: testJson, editor: Editor.Monaco, vanillaMode: VanillaMode.Text })
      this.activeId = id
    },
    updateTabContent(id: string, content: string) {
      const menuItem = this.menuItems.find(t => t.id === id)
      if (menuItem) {
        menuItem.content = content
      }
    },
    updateCurrentTabContent(content: string) {
      if (this.activeTab) {
        this.activeTab.content = content
      }
    },
    delTab(targetId: string) {
      const index = this.menuItems.findIndex(pane => pane.id === targetId)
      if (index === -1)
        return

      this.menuItems.splice(index, 1)

      if (this.activeId === targetId) {
        this.activeId = this.menuItems[Math.min(index, this.menuItems.length - 1)]?.id || ''
      }

      if (this.menuItems.length === 0) {
        this.addTab()
      }
    },
    updateTabTitle(id: string, newTitle: string) {
      const menuItem = this.menuItems.find(t => t.id === id)
      if (menuItem) {
        menuItem.title = newTitle
      }
    },
    updateCurrentMenuItem(item: MenuItem) {
      const index = this.menuItems.findIndex(t => t.id === item.id)
      if (index !== -1) {
        this.menuItems.splice(index, 1, item)
      }
    },
    clearContent(id: string) {
      const menuItem = this.menuItems.find(t => t.id === id)
      if (menuItem) {
        menuItem.content = ''
      }
    },
    closeLeftTabs(index: number) {
      const pinnedTabs = this.menuItems.slice(0, index).filter(tab => tab.isPinned)
      this.menuItems = [...pinnedTabs, ...this.menuItems.slice(index)]
      this.activeId = this.menuItems[0]?.id || ''
    },
    closeRightTabs(index: number) {
      const pinnedTabs = this.menuItems.slice(index + 1).filter(tab => tab.isPinned)
      this.menuItems = [...this.menuItems.slice(0, index + 1), ...pinnedTabs]
      this.activeId = this.menuItems[index]?.id || ''
    },
    closeOtherTabs(id: string) {
      const currentTab = this.menuItems.find(tab => tab.id === id)
      if (!currentTab)
        return
      const pinnedTabs = this.menuItems.filter(tab => tab.isPinned && tab.id !== id)
      this.menuItems = [...pinnedTabs, currentTab]
      this.activeId = currentTab.id
    },
    closeAllTabs() {
      const pinnedTabs = this.menuItems.filter(tab => tab.isPinned)
      this.menuItems = pinnedTabs
      if (this.menuItems.length === 0) {
        this.addTab()
      } else {
        this.activeId = this.menuItems[0].id
      }
      this.nextId = 0
    },
    togglePinTab(id: string) {
      const menuItem = this.menuItems.find(t => t.id === id)
      if (menuItem) {
        menuItem.isPinned = !menuItem.isPinned
      }
    },
    changeEditor(id: string, editor: Editor) {
      const menuItem = this.menuItems.find(t => t.id === id)
      if (menuItem) {
        menuItem.editor = editor
      }
    },
    // Vanilla 转换为 json 文本
    vanilla2JsonContent() {
      if (!this.activeTab.vanilla) {
        return undefined
      }
      if (!this.activeTab.vanilla) {
        return undefined
      }
      if (this.activeTab.vanilla.json) {
        this.activeTab.content = JSON.stringify(this.activeTab.vanilla.json, null, 4)
      } else if (this.activeTab.vanilla.text) {
        this.activeTab.content = this.activeTab.vanilla.text ? this.activeTab.vanilla.text : ''
      }
    },
    jsonContent2VanillaContent() {
      if (!this.activeTab.content) {
        this.activeTab.vanilla = { text: '' }
        this.activeTab.vanillaMode = VanillaMode.Text
        return
      }
      try {
        this.activeTab.vanilla = { json: JSON.parse(this.activeTab.content) }
        this.activeTab.vanillaMode = VanillaMode.Tree
      } catch (e) {
        console.log('jsonTextUpdate 解析失败', e)
        this.activeTab.vanillaMode = VanillaMode.Text
        this.activeTab.vanilla = { text: this.activeTab.content }
      }
    },
  },
})
