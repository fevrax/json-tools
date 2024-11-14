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
  <div>
    <a-menu @click="({ key }) => handleContextMenuAction(key, item)">
      <a-menu-item key="pin" title="">
        <PushpinOutlined /> {{ item.isPinned ? '取消置顶' : '置顶' }}
      </a-menu-item>
      <a-menu-item key="copy" title="">
        <CopyOutlined /> 复制
      </a-menu-item>
      <a-menu-item key="rename" title="">
        <EditOutlined /> 重命名
      </a-menu-item>
      <a-menu-item key="close" title="">
        <DeleteOutlined /> 关闭当前
      </a-menu-item>
      <a-menu-item key="closeAll" title="">
        <CloseOutlined /> 关闭所有
      </a-menu-item>
    </a-menu>
  </div>
</template>

<style scoped lang="scss">

</style>
