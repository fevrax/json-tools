import { defineStore } from 'pinia'

interface Tab {
  title: string
  content: string
  key: string
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: [] as Tab[],
    activeKey: '',
    key: 0,
  }),
  actions: {
    addTab(title: string) {
      this.key++
      if (title === '') {
        title = `New Tab - ${this.key}`
      }
      this.tabs.push({ title, content: '', key: this.key })
      this.activeKey = this.key
    },
    // 获取当前激活的tab
    getActiveTab() {
      return this.tabs.find(t => t.key === this.activeKey)
    },
    delTab(targetKey: string) {
      let lastIndex = 0
      this.tabs.forEach((pane, i) => {
        if (pane.key === targetKey) {
          lastIndex = i - 1
        }
      })
      this.tabs = this.tabs.filter(pane => pane.key !== targetKey)
      if (this.tabs.length && this.activeKey === targetKey) {
        if (lastIndex >= 0) {
          this.activeKey = this.tabs[lastIndex].key
        }
        else {
          this.activeKey = this.tabs[0].key
        }
      }
    },
    updateTabTitle(key: string, newTitle: string) {
      const tab = this.tabs.find(t => t.key === key)
      if (tab) {
        tab.title = newTitle
      }
    },
    clearContent(key: string) {
      const tab = this.tabs.find(t => t.key === key)
      if (tab) {
        tab.content = ''
      }
    },
    closeLeftTabs(index: number) {
      this.tabs.splice(0, index)
      if (this.tabs.length > 0) {
        this.activeKey = this.tabs[0].key
      }
    },

    closeRightTabs(index: number) {
      this.tabs.splice(index + 1)
      this.activeKey = this.tabs[index].key
    },

    closeOtherTabs(index: number) {
      const currentTab = this.tabs[index]
      this.tabs = [currentTab]
      this.activeKey = currentTab.key
    },

    closeAllTabs() {
      this.key = 0
      this.tabs = []
      this.addTab('') // 添加一个新的空白标签页
    },
  },
})
