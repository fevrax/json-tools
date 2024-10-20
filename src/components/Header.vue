<script setup lang="ts">

import {
  Add,
  CopyOutline
} from '@vicons/ionicons5'

const copyItems = ref([
  {
    key: 'compressedCopy',
    label: '压缩后复制',
    icon: renderIcon(Add)
  },
  {
    key: 'escapeCopy',
    label: '转义后复制',
    icon: renderIcon(Add)
  }
])

</script>

<template>
  <div class="border-b dark:border-b-neutral-800 w-full top-0 h-10">
    <n-flex class="h-full px-1" align="center" justify="space-between">
      <n-flex class="flex">
        <n-flex style="width: 55px" justify="center">
          <n-avatar
            round
            size="small"
            src="https://minio.kl.do/picture/images/avatar-y.png"
          />
        </n-flex>
        <div id="left-button" class="flex">
          <header-menu :icon="renderIcon(Add)" name="新建"></header-menu>
          <header-menu :icon="renderIcon(CopyOutline)" name="复制" :items="copyItems"></header-menu>
        </div>
      </n-flex>
      <div class="flex">
        <div id="left-button" class="flex">
          <!--          <header-menu :icon="renderIcon(Add)" name="新建"></header-menu>-->
          <header-menu :icon="renderIcon(CopyOutline)" name="复制" :items="copyItems"></header-menu>
        </div>
        <n-flex justify="center" align="center" class="pr-3">
          <theme-toggle></theme-toggle>
        </n-flex>
      </div>
    </n-flex>
  </div>
</template>

<style>

</style>
