<script setup lang="ts">
import { UserOutlined, DownOutlined } from '@ant-design/icons-vue';

const copyItems = ref([
  {
    key: 'compressedCopy',
    label: '压缩后复制',
    icon: renderIcon('add')
  },
  {
    key: 'escapeCopy',
    label: '转义后复制',
    icon: renderIcon('copy')
  }
])

</script>

<template>
  <div class="h-5 relative inline-block">
    <a-dropdown-button @click="handleButtonClick" >
      复制
      <template #overlay>
        <a-menu @click="handleMenuClick">
          <a-menu-item key="1">
            <UserOutlined />
            压缩后复制
          </a-menu-item>
          <a-menu-item key="2">
            <UserOutlined />
            转义后复制
          </a-menu-item>
        </a-menu>
      </template>
      <template #icon>
        <div>
          <UserOutlined />
        </div>
      </template>
    </a-dropdown-button>
  </div>
</template>

<style scoped lang="scss">

</style>
