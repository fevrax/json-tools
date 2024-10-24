<script setup lang="ts">
import { CheckOutlined, EditOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import { useTabsStore } from '~/stores/tabs'

const tabsStore = useTabsStore()
const editingKey = ref<string | null>(null)
const editingTitle = ref('')

// tab 操作
function onTabEdit(targetKey: string | MouseEvent, action: string) {
  if (action === 'add') {
    tabsStore.addTab('')
  }
  else {
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

// 格式化并验证
const jsonEditorRefs: Ref<{ [key: number]: typeof JsonEditor | null }> = ref({})
async function formatHandle(tabKey: string, callback: (success: boolean) => void) {
  try {
    const editor = jsonEditorRefs.value[`jsonEditor${tabKey}`]
    if (editor && typeof editor.format === 'function') {
      const success = editor.formatValidate()
      callback(success)
    }
    else {
      callback(false)
    }
  }
  catch {
    message.error('格式化内容异常', e.message)
    callback(false)
  }
}

// 验证内容
async function validateHandle(tabKey: string, callback: (success: boolean) => void) {
  try {
    const editor = jsonEditorRefs.value[`jsonEditor${tabKey}`]
    if (editor && typeof editor.validateContent === 'function') {
      const success = editor.validateContent()
      callback(success)
    }
    else {
      callback(false)
    }
  }
  catch (e) {
    message.error('验证内容异常', e.message)
    callback(false)
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
</script>

<template>
  <Header @format="formatHandle" @validate="validateHandle" />
  <div class="c-tab">
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
        <div class="h-screen w-full">
          <json-editor
            :ref="(el) => { if (el) jsonEditorRefs[`jsonEditor${tab.key}`] = el }"
            v-model="tab.content"
            language="json"
            :theme="isDark ? 'vs-dark' : 'vs-light'"
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
.c-tab {
  .custom-tabs {
    .ant-tabs-nav {
      margin-bottom: 6px;
      height: 35px;

      &::before {
        border-bottom: 1px solid #e8e8e8;
        @apply dark:border-zinc-700;
      }
    }

    .ant-tabs-tab {
      @apply bg-transparent dark:bg-transparent;
      border: none;
      margin-right: 18px; // 增加间距
      padding: 8px 5px 8px 20px;
      transition: all 0.3s;
      position: relative; // 为下边框定位

      .ant-tabs-tab-btn {
        @apply text-gray-600 dark:text-gray-400;
        font-weight: 500;
      }

      &:hover {
        @apply text-blue-500 dark:text-blue-400;
      }

      // 选中按钮
      &.ant-tabs-tab-active {
        background: transparent; // 移除背景色

        .ant-tabs-tab-btn {
          @apply text-blue-500 dark:text-blue-400;
        }

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          @apply bg-blue-500 dark:bg-blue-400;
          transition: all 0.3s;
        }
      }
    }

    // 添加按钮
    .ant-tabs-nav-add {
      @apply border-none bg-transparent dark:bg-transparent text-gray-600 dark:text-gray-400;
      padding: 8px 12px;
      margin-left: 10px;
      transition: all 0.3s;

      &:hover {
        @apply text-blue-500 dark:text-blue-400;
      }
    }
  }

  .edit-icon {
    margin-left: 8px;
    opacity: 0;
    transition: opacity 0.3s;
    @apply text-gray-400 dark:text-gray-500;
  }

  .ant-tabs-tab:hover .edit-icon {
    opacity: 1;
  }

  .editing-tab {
    display: flex;
    align-items: center;

    .editing-tab-input {
      width: 120px;
      margin-right: 4px;
      @apply bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-200;
    }

    .confirm-icon,
    .cancel-icon {
      cursor: pointer;
      margin-left: 4px;
      @apply text-blue-500 dark:text-blue-400;
    }
  }
}

// 输入框样式
.editing-tab-input {
  width: 120px;
  margin-right: 4px;
  @apply bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-200;
}

:root.dark {
  .ant-tabs-content {
    @apply bg-zinc-800 text-gray-200;
  }

  .ant-tabs-ink-bar {
    @apply bg-blue-400;
  }
}
</style>
