<script setup lang="ts">
import { CloseOutlined, CopyOutlined, DeleteOutlined, EditOutlined, PushpinOutlined } from '@ant-design/icons-vue'
import { onMounted, onUnmounted } from 'vue'
import type { MenuItem } from '~/stores/sidebar'

interface props {
  item: MenuItem
}

defineProps<props>()

const emit = defineEmits<{
  // eslint-disable-next-line no-unused-vars
  (e: 'select', key: string): void
}>()

function handleContextMenuAction(key: string, item: MenuItem) {
  emit('select', key, item)
}

onMounted(() => {
})

onUnmounted(() => {
})
</script>

<template>
  <a-menu @click="({ key }) => handleContextMenuAction(key, item)">
    <a-menu-item key="pin" style="z-index: 19999">
      <PushpinOutlined /> {{ item.isPinned ? '取消置顶' : '置顶' }}
    </a-menu-item>
    <a-menu-item key="copy">
      <CopyOutlined /> 复制
    </a-menu-item>
    <a-menu-item key="rename">
      <EditOutlined /> 重命名
    </a-menu-item>
    <a-menu-item key="close">
      <DeleteOutlined /> 关闭当前
    </a-menu-item>
    <a-menu-item key="closeAll">
      <CloseOutlined /> 关闭所有
    </a-menu-item>
  </a-menu>
</template>

<style scoped lang="scss">

</style>
