<script setup lang="ts">
import { CheckOutlined, EditOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import type { Tab } from '~/stores/tabs'
import { useTabsStore } from '~/stores/tabs'

const tabsStore = useTabsStore()
const editingKey = ref<string | null>(null)
const editingTitle = ref('')

// tab 操作
function onTabEdit(targetKey: string | MouseEvent, action: string) {
  if (action === 'add') {
    tabsStore.addTab('')
  } else {
    tabsStore.delTab(targetKey)
  }
}

// 编辑 tab title
function startEditing(key: string, title: string) {
  editingKey.value = key
  editingTitle.value = title
}

// 确认编辑
function finishEditing() {
  if (editingKey.value) {
    tabsStore.updateTabTitle(editingKey.value, editingTitle.value)
    editingKey.value = null
  }
}

const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  tabKey: '',
})

// 右键菜单处理函数
function handleContextMenu(event: MouseEvent, tabKey: string) {
  event.preventDefault()
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    tabKey,
  }
}

// 关闭右键菜单
function closeContextMenu() {
  contextMenu.value.show = false
}

// 处理右键菜单选项
function handleContextMenuSelect(action: string) {
  const currentTabIndex = tabsStore.tabs.findIndex(tab => tab.key === contextMenu.value.tabKey)

  switch (action) {
    case 'closeLeft':
      tabsStore.closeLeftTabs(currentTabIndex)
      break
    case 'closeRight':
      tabsStore.closeRightTabs(currentTabIndex)
      break
    case 'closeOthers':
      tabsStore.closeOtherTabs(currentTabIndex)
      break
    case 'closeAll':
      tabsStore.closeAllTabs()
      break
  }

  closeContextMenu()
}

function jsonTextUpdate(jsonText: string) {
  tabsStore.updateCurrentTabContent(jsonText)
}

function parseEditJsonData(tab: Tab) {
  let currentTabContent = ''
  try {
    currentTabContent = JSON.parse(tab?.content)
  } catch (e) {
    console.error(e)
  }
  return currentTabContent
}

onMounted(() => {
  // tabsStore.addTestTab()
  // if

})
</script>

<template>
  <div class="tree-tab">
    <a-tabs
      v-model:active-key="tabsStore.activeKey"
      type="editable-card"
      class="custom-tabs"
      @edit="onTabEdit"
    >
      <a-tab-pane v-for="tab in tabsStore.tabs" :key="tab.key">
        <template #tab>
          <div @contextmenu.prevent="handleContextMenu($event, tab.key)">
            <span v-if="editingKey !== tab.key" @dblclick="startEditing(tab.key, tab.title)">
              {{ tab.title }}
              <EditOutlined class="edit-icon" @click.stop="startEditing(tab.key, tab.title)" />
            </span>
            <span v-else class="editing-tab">
              <a-input
                v-model:value="editingTitle"
                class="editing-tab-input"
                size="small"
                @press-enter="finishEditing"
                @blur="finishEditing"
                @click.stop=""
              />
              <CheckOutlined class="confirm-icon" @click.stop="finishEditing" />
            </span>
          </div>
        </template>
        <div>
          <VanillaJsonEditor
            :model-value="parseEditJsonData(tab)"
            @update:model-value="jsonTextUpdate"
          />
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>

  <ContextMenu
    :show="contextMenu.show"
    :x="contextMenu.x"
    :y="contextMenu.y"
    @close="closeContextMenu"
    @select="handleContextMenuSelect"
  />
</template>

<style lang="scss">
@use '../styles/treeTabs';

.tree-tab {
  .custom-tabs {
    .ant-tabs-nav {
      margin-bottom: 2px;

      .ant-tabs-nav-wrap {
        position: absolute;
        top: 40px;
        z-index: 9999;
      }
    }
  }
}
</style>
