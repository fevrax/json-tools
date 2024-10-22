<script setup lang="ts">
import { CheckOutlined, EditOutlined } from '@ant-design/icons-vue'
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
</script>

<template>
  <div class="c-tab">
    <a-tabs
      v-model:active-key="tabsStore.activeKey"
      type="editable-card"
      class="custom-tabs"
      @edit="onTabEdit"
    >
      <a-tab-pane v-for="tab in tabsStore.tabs" :key="tab.key">
        <template #tab>
          <span v-if="editingKey !== tab.key" @dblclick="startEditing(tab.key, tab.title)">
            {{ tab.title }}
            <EditOutlined class="edit-icon" @click.stop="startEditing(tab.key, tab.title)" />
          </span>
          <span v-else class="editing-tab">
            <a-input
              class="editing-tab-input"
              v-model:value="editingTitle"
              size="small"
              @press-enter="finishEditing"
              @blur="finishEditing"
              @click.stop=""
            />
            <CheckOutlined class="confirm-icon" @click.stop="finishEditing" />
          </span>
        </template>
        {{ tab.content }}
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<style lang="scss">
.c-tab {
  .custom-tabs {
    .ant-tabs-nav {
      margin-bottom: 0;
      height: 35px;

      &::before {
        border-bottom: none;
      }
    }

    .ant-tabs-tab {
      @apply bg-white dark:bg-zinc-800;
      .ant-tabs-tab-btn {
        @apply dark:text-gray-400;
      }
      border: none;
      margin-right: 4px;
      padding: 8px 16px;
      transition: all 0.3s;

      &:hover {
        @apply bg-gray-100 dark:bg-zinc-700;
      }

      // 选中按钮
      &.ant-tabs-tab-active {
        background: #e6f4ff;
        @apply text-blue-500 dark:bg-zinc-700;

        .ant-tabs-tab-btn {
          @apply dark:text-white;
        }
      }
    }

    // 添加按钮
    .ant-tabs-tab-btn {
      @apply text-gray-800 dark:text-gray-200;
    }

    .ant-tabs-nav-add {
      @apply border-none bg-white dark:bg-zinc-800;
    }
  }

  .edit-icon {
    margin-left: 8px;
    margin-right: 4px;
    opacity: 0;
    transition: opacity 0.3s;
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
      @apply dark:bg-zinc-700 dark:text-gray-200;
    }

    .confirm-icon,
    .cancel-icon {
      cursor: pointer;
      margin-left: 4px;
      margin-right: 4px;
      @apply dark:text-gray-200;
    }
  }
}

// 输入框样式
.editing-tab-input {
  width: 120px;
  margin-right: 4px;
  @apply dark:bg-zinc-700 text-blue-500 dark:text-gray-200;
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
