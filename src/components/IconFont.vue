<script setup lang="ts">
import { createFromIconfontCN } from '@ant-design/icons-vue'

interface Props {
  type: string
  size?: string
}

const props = defineProps<Props>()

const style = {
  fontSize: props.size ? `${props.size}px` : '18px',
}

const IconFontCn = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/c/font_4717353_gtl6l4sy586.js',
})
</script>

<template>
  <div class="flex items-center justify-center">
    <IconFontCn :type="type" :style="style" />
  </div>
</template>

<style scoped>

</style>
