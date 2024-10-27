import { defineStore } from 'pinia'

export interface MenuItem {
  id: string
  title: string
  editor: 'monaco' | 'vanilla'
  isPinned: boolean
  content?: string
}

export enum Editor {
  Monaco = 'monaco',
  Vanilla = 'vanilla',
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
    addTab(title: string = '', editor: Editor = Editor.Monaco) {
      const id = `menuItem-${this.nextId++}`
      title = title || `New Tab - ${this.nextId}`
      this.menuItems.push({ id, title, editor, isPinned: false, content: '' })
      this.activeId = id
    },
    addTestTab() {
      const id = `menuItem-${this.nextId++}`
      this.menuItems.push({ id, title: 'Test Tab', editor: Editor.Monaco, isPinned: false, content: testJson })
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
  },
})
