<script setup lang="ts">
import {
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  PushpinFilled,
  PushpinOutlined,
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { MenuItem } from '~/stores/sidebar'

// 新增: 定义props
const props = defineProps<{
  items: MenuItem[]
}>()

// 新增: 定义emit
const emit = defineEmits<{
  (e: 'update:items', items: MenuItem[]): void
  (e: 'select', itemId: string): void
}>()

const menuItems = ref<MenuItem[]>(props.items)

// 监听props变化
watch(() => props.items, (newItems) => {
  menuItems.value = newItems
}, { deep: true })

const editingItemId = ref<string | null>(null)
const editingInput = ref<HTMLInputElement | null>(null)
const sidebarWidth = ref(200)
const activeItemId = ref<string | null>(null)
const selectedItemId = ref<string | null>(null)

const isNarrow = computed(() => sidebarWidth.value < 60)

const sortedMenuItems = computed(() => {
  return [...menuItems.value].sort((a, b) => {
    if (a.isPinned === b.isPinned) {
      return menuItems.value.findIndex(item => item.id === a.id) - menuItems.value.findIndex(item => item.id === b.id)
    }
    return a.isPinned ? -1 : 1
  })
})

function startEditing(item: MenuItem) {
  if (isNarrow.value)
    return
  editingItemId.value = item.id
}

function stopEditing(item: MenuItem, newTitle: string) {
  if (newTitle && newTitle.trim()) {
    item.title = newTitle.trim()
    updateMenuItems()
  }
  editingItemId.value = null
}

function togglePin(item: MenuItem) {
  item.isPinned = !item.isPinned
  updateMenuItems()
}

function copyItem(item: MenuItem) {
  const newItem: MenuItem = { ...item, id: Date.now().toString(), isPinned: false }
  menuItems.value.push(newItem)
  updateMenuItems()
  message.success('Item copied successfully')
}

function deleteItem(item: MenuItem) {
  Modal.confirm({
    title: 'Are you sure you want to delete this item?',
    content: 'This action cannot be undone.',
    onOk: () => {
      menuItems.value = menuItems.value.filter(i => i.id !== item.id)
      updateMenuItems()
      message.success('Item deleted successfully')
    },
  })
}

function handleContextMenuAction(key: string, item: MenuItem) {
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
    case 'delete':
      deleteItem(item)
      break
  }
  activeItemId.value = null
}

function truncateTitle(title: string, maxLength: number = 4) {
  return title.length > maxLength
    ? `${title.slice(0, maxLength)}...`
    : title
}

function selectItem(itemId: string) {
  selectedItemId.value = itemId
  emit('select', itemId)
}

// 新增: 更新menuItems并触发emit
function updateMenuItems() {
  emit('update:items', menuItems.value)
}

// Resize observer to update sidebar width
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
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// 新增: 暴露方法给父组件
defineExpose({
  addMenuItem: (item: MenuItem) => {
    menuItems.value.push(item)
    updateMenuItems()
  },
  removeMenuItem: (itemId: string) => {
    menuItems.value = menuItems.value.filter(item => item.id !== itemId)
    updateMenuItems()
  },
  getSelectedItemId: () => selectedItemId.value,
})
</script>

<template>
  <div class="sidebar-menu h-full overflow-y-auto transition-all duration-300 ease-in-out">
    <ul>
      <li
        v-for="item in sortedMenuItems"
        :key="item.id"
        class="group relative px-2 py-2 transition-all duration-200 ease-in-out hover:bg-gray-200 dark:hover:bg-neutral-800"
        :class="{
          'pr-0': isNarrow,
          'bg-neutral-200 dark:bg-neutral-800': selectedItemId === item.id,
        }"
        @click="selectItem(item.id)"
      >
        <div class="flex items-center justify-between">
          <div class="flex-grow mr-2 overflow-hidden" @dblclick="startEditing(item)">
            <div v-if="editingItemId === item.id && !isNarrow" class="flex items-center">
              <input
                ref="editingInput"
                :value="item.title"
                class="w-full px-2 py-1 bg-transparent border-none focus:outline-none"
                @keyup.enter="stopEditing(item, $event.target.value)"
                @blur="stopEditing(item, $event.target.value)"
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
              class="block truncate"
            >
              <span v-if="isNarrow">
                <a-tooltip :title="item.title" placement="right">
                  <span>{{ truncateTitle(item.title, 4) }}</span>
                </a-tooltip>
              </span>
              <span v-else class="flex items-center">
                <PushpinFilled v-if="item.isPinned" class="mr-1 text-blue-600" />
                {{ item.title }}
              </span>
            </span>
          </div>
          <!-- 右侧操作按钮 -->
          <div v-if="!isNarrow && editingItemId !== item.id" class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <a-dropdown :trigger="['click']">
              <a class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                <EllipsisOutlined class="text-18" />
              </a>
              <template #overlay>
                <a-menu @click="({ key }) => handleContextMenuAction(key, item)">
                  <a-menu-item key="pin">
                    <PushpinOutlined /> {{ item.isPinned ? '取消置顶' : '置顶' }}
                  </a-menu-item>
                  <a-menu-item key="rename">
                    <EditOutlined /> 重命名
                  </a-menu-item>
                  <a-menu-item key="copy">
                    <CopyOutlined /> 复制
                  </a-menu-item>
                  <a-menu-item key="delete">
                    <DeleteOutlined /> 删除
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.sidebar-menu {
  width: 100%;
  li {
    &:hover {
      .ant-dropdown-trigger {
        opacity: 1;
      }
    }
    .ant-dropdown-trigger {
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }
  }
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
