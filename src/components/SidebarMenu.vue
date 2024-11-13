<script setup lang="ts">
import {
  CheckOutlined,
  EllipsisOutlined,
  PlusOutlined,
  PushpinFilled,
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import type { MenuItem } from '~/stores/sidebar'
import { useSidebarStore } from '~/stores/sidebar'

const emit = defineEmits<{
  // eslint-disable-next-line no-unused-vars
  (e: 'toggleCollapsed', key: string): void
}>()

const sidebarStore = useSidebarStore()

const editingItemId = ref<string | null>(null)
const editingInput = ref<HTMLInputElement | null>(null)
const sidebarWidth = ref(200)
const activeItemId = ref<string | null>(null)

const isNarrow = computed(() => sidebarWidth.value < 60)

const sortedMenuItems = computed(() => {
  return [...sidebarStore.menuItems].sort((a, b) => {
    if (a.isPinned === b.isPinned) {
      return sidebarStore.menuItems.findIndex(item => item.id === a.id) - sidebarStore.menuItems.findIndex(item => item.id === b.id)
    }
    return a.isPinned ? -1 : 1
  })
})

function startEditing(item: MenuItem) {
  // if (isNarrow.value) {
  //   return
  // }
  emit('toggleCollapsed', true)
  editingItemId.value = item.id
  // 使用nextTick确保input已渲染后再focus
  nextTick(() => {
    // 获取input元素并focus
    const input = document.querySelector('.editing-input') as HTMLInputElement
    if (input) {
      input.focus()
      // 可选:全选文本
      input.select()
    }
  })
}

function stopEditing(item: MenuItem, newTitle: string) {
  if (newTitle && newTitle.trim()) {
    item.title = newTitle.trim()
  }
  editingItemId.value = null
}

function togglePin(item: MenuItem) {
  item.isPinned = !item.isPinned
}

function copyItem(item: MenuItem) {
  const id = `tab${sidebarStore.nextId++}`
  const newItem: MenuItem = { ...item, id, isPinned: false }
  newItem.title += '-copy'
  sidebarStore.menuItems.push(newItem)
  sidebarStore.activeId = id
  scrollToSelectedItem()
  message.success('复制成功')
}

function closeItem(item: MenuItem) {
  sidebarStore.delTab(item.id)
  message.success('关闭成功')
}

function closeAllItem() {
  Modal.confirm({
    title: '您确定要关闭所有标签页吗？',
    content: '该操作无法撤销。',
    onOk: () => {
      sidebarStore.delAllTabs()
      sidebarStore.addTab('')
      message.success('关闭成功')
    },
  })
}

function handleContextMenuAction(key: string, item: MenuItem) {
  console.log(key, item)
  switch (key) {
    case 'pin':
      togglePin(item)
      break
    case 'rename':
      startEditing(item)
      break
    case 'copy':
      copyItem(item)
      break
    case 'close':
      closeItem(item)
      break
    case 'closeAll':
      closeAllItem(item)
      break
  }
  activeItemId.value = null
}

function truncateTitle(title: string, maxLength: number = 5) {
  return title.length > maxLength
    ? `${title.slice(0, maxLength)}...`
    : title
}

function selectItem(itemId: string) {
  sidebarStore.activeId = itemId
}

function addNewMenuItem() {
  sidebarStore.addTab()
  scrollToAddSelectedItem()
}

// 滚动到选中的菜单项
function scrollToSelectedItem() {
  nextTick(() => {
    const selectedElement = document.querySelector(`[data-item-id="${sidebarStore.activeId}"]`)
    if (selectedElement) {
      selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  })
}

// 新增后滚动到选中项
function scrollToAddSelectedItem() {
  nextTick(() => {
    if (isNarrow.value) {
      const selectedElement = document.querySelector(`.addItemButton`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    } else {
      const selectedElement = document.querySelector(`[data-item-id="${sidebarStore.activeId}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  })
}

// 调整观察者的大小以更新侧边栏宽度
let resizeObserver: ResizeObserver
onMounted(() => {
  const sidebarElement = document.querySelector('.sidebar-menu')
  if (sidebarElement) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        sidebarWidth.value = entry.contentRect.width
      }
    })
    resizeObserver.observe(sidebarElement)
  }

  // 初始滚动到选中项
  scrollToSelectedItem()
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

defineExpose({
  addNewMenuItem,
  getSelectedItemId: () => sidebarStore.activeId,
})
</script>

<template>
  <div class="sidebar-menu h-full transition-all duration-300 ease-in-out">
    <ul>
      <li
        v-for="item in sortedMenuItems"
        :key="item.id"
        :data-item-id="item.id"
        class="group relative pl-2 pr-1 py-2 transition-all duration-200 ease-in-out hover:bg-gray-200 dark:hover:bg-neutral-800"
        :class="{
          'pr-0': isNarrow,
          'bg-gray-200 dark:bg-neutral-800': sidebarStore.activeId === item.id,
        }"
        @click="selectItem(item.id)"
      >
        <a-dropdown :trigger="['contextmenu']">
          <div class="flex items-center justify-between">
            <div class="flex-grow mr-2 overflow-hidden" @dblclick.stop="startEditing(item)">
              <div v-if="editingItemId === item.id && !isNarrow" class="flex items-center">
                <input
                  ref="editingInput"
                  :value="item.title"
                  class="w-full px-2 py-1 bg-transparent border-none focus:outline-none editing-input"
                  @blur="stopEditing(item, $event.target.value)"
                  @keyup.enter="stopEditing(item, $event.target.value)"
                >
                <button
                  class="ml-2 hover:text-green-600 transition-colors duration-200"
                  @click="stopEditing(item, editingInput?.value || '')"
                >
                  <CheckOutlined />
                </button>
              </div>
              <span
                v-else
                :class="{ 'font-semibold': item.isPinned }"
                class="block truncate select-none"
              >
                <span v-if="isNarrow">
                  <a-tooltip :title="item.title" placement="right" class="text-13">
                    <span>{{ truncateTitle(item.title, 6) }}</span>
                  </a-tooltip>
                </span>
                <span v-else class="flex items-center">
                  <PushpinFilled v-if="item.isPinned" class="mr-1 text-blue-600" />
                  {{ item.title }}
                </span>
              </span>
            </div>
            <div v-if="!isNarrow && editingItemId !== item.id" class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <a-dropdown :trigger="['hover']">
                <a class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                  <EllipsisOutlined class="text-18" />
                </a>
                <template #overlay>
                  <ContextMenu :item="item" @select="handleContextMenuAction" />
                </template>
              </a-dropdown>
            </div>
          </div>
          <template #overlay>
            <ContextMenu :item="item" @select="handleContextMenuAction" />
          </template>
        </a-dropdown>
      </li>
      <li>
        <a-button
          v-if="isNarrow"
          type="text"
          class="addItemButton w-full mt-2 flex justify-center items-center hover:bg-gray-200 dark:hover:bg-neutral-800"
          @click.stop="addNewMenuItem"
        >
          <PlusOutlined />
        </a-button>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.sidebar-menu {
  width: 100%;
  overflow-y: auto;

  input {
    transition: all 0.3s ease-in-out;
    &:focus {
      outline: none;
    }
  }
  button,
  .ant-dropdown-trigger {
    transition: all 0.2s ease-in-out;
  }
}

/* 隐藏默认滚动条 */
@supports (scrollbar-width: none) {
  .sidebar-menu {
    scrollbar-width: none;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
