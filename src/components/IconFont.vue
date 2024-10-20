<script setup lang="ts">
import { createFromIconfontCN } from '@ant-design/icons-vue';

interface Props {
  type: string
}

const props = defineProps<Props>()

const IconFontCn = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/c/font_4717353_puoe3wbeegi.js',
});

</script>

<template>
  <div>
    <icon-font-cn :type="type" style="font-size: 18px" />
  </div>
</template>

<style scoped>

</style>
