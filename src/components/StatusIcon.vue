<script setup lang="ts">
import { computed } from 'vue'
import IconParkSolidError from '~/components/icon/IconParkSolidError.vue'

const props = defineProps<{
  defaultIcon: any
  status: 'default' | 'success' | 'error'
}>()

const iconComponent = computed(() => {
  switch (props.status) {
    case 'success':
      return renderIconFontSize('icon-park-solid:success', 17)
    case 'error':
      return () => h(IconParkSolidError)
    default:
      return props.defaultIcon
  }
})

const iconStyle = computed(() => ({
  color: props.status === 'success' ? '#52c41a' : props.status === 'error' ? '#f5222d' : undefined,
}))
</script>

<template>
  <component :is="iconComponent" :style="iconStyle" />
</template>

<style scoped>
.anticon-check {
  color: #52c41a;
  transform: scale(1.1);
}

.anticon-close {
  color: #f5222d;
  transform: scale(1.1);
}
</style>
