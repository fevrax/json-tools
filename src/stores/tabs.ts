import { defineStore } from 'pinia'

interface Tab {
  title: string
  content: string
  key: string
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: [] as Tab[],
    activeKey: 0,
    key: 0,
  }),
  actions: {
    addTab(title: string) {
      this.key++
      if (title === '') {
        title = `New Tab - ${this.key}`
      }
      this.tabs.push({ title, content: title, key: this.key })
      this.activeKey = this.key
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
  },
})
