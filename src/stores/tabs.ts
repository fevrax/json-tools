import { defineStore } from 'pinia'

interface Tab {
  title: string
  content: string
  key: string
}

const testJson = `{"version":"1.0","globalConfig":{"logging":{"level":"debug"}},"dataSources":[{"name":"ssd571","type":"redis","config":{"address":"ssd571","port":"50571","password":"","timeout":"5000ms"}}],"endpoints":[{"id":"teamUpOnTime","datamoreId":13511,"path":"/dmfeature/13511/teamUpOnTime","description":"无畏契约-准点开黑活动-玩家有效开黑对局日期列表","method":"GET","template":"get","apiParams":[{"name":"env","type":"string","required":1,"comment":"环境变量  1 正式 2测试","exampleValue":"1"},{"name":"roleId","type":"string","required":1,"comment":"角色id","exampleValue":"123344"}],"apiResponse":{"type":"json","comment":"仅用于描述","params":[{"name":"count","type":"string","required":1,"comment":"对局总数","exampleValue":"1"},{"name":"","type":"string","required":1,"comment":"角色id","exampleValue":"123344"}]},"templateFetchLogic":{"type":"redis","dbAddress":"ssd571","keyBuilderTyp":1,"keyPrefix":"rt|agame|zdkh","keyDelimiter":"|","keyOrder":["env","roleId","$shards"],"keyFormat":"rt|agame|zdkh|{env}|{roleId}|shards","redisType":"string  默认值","tspShards":[0,3],"tspDayDurMax":7},"templateParseLogic":{"sourceDataType":"json text","jsonParseRule":{"a1":"name","a2":"rank","a3":"dtEventTime"},"textDelimiter":[";","|"],"textDelimParseFields":["dtEventTime","name"]},"templateSortLogic":[{"field":"rank","type":"int","order":"asc"},{"field":"dtEventTime","type":"string","order":"asc"},{"field":"name","type":"string","order":"asc"}]}]}`
// const testJson = `[{"name":"feng1","age":18},{"name":"feng2","age":18},{"name":"feng2","age":18}]`

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
    addTestTab() {
      this.key++
      this.tabs.push({ title: 'text Tab', content: testJson, key: this.key })
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
