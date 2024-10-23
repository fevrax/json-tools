<script setup lang="ts">
import { computed } from 'vue'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  defaultIcon: any,
  status: 'default' | 'success' | 'error'
}>()

const iconComponent = computed(() => {
  switch (props.status) {
    case 'success':
      return CheckOutlined
    case 'error':
      return CloseOutlined
    default:
      return props.defaultIcon
  }
})

const iconStyle = computed(() => ({
  color: props.status === 'success' ? '#52c41a' : props.status === 'error' ? '#f5222d' : undefined
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
