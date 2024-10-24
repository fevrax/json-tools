<script setup lang="ts">
import type { IconProps } from '@iconify/vue'
import { Icon } from '@iconify/vue'

const props = defineProps<IconProps>()
</script>

<template>
  <component :is="Icon" v-bind="props" />
</template>

<style scoped>
</style>
