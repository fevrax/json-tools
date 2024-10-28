<script setup lang="ts">
import { computed } from 'vue'
import StatusIcon from './StatusIcon.vue'

const props = defineProps<{
  text: string
  icon: any
  status: 'default' | 'success' | 'error'
}>()

const textClass = computed(() => ({
  'text-success': props.status === 'success',
  'text-error': props.status === 'error',
}))
</script>

<template>
  <a-button type="link" class="!mr-2 check-btn">
    <div class="flex items-center">
      <span class="mr-1 check-icon pb-0.5">
        <StatusIcon :default-icon="icon" :status="status" />
      </span>
      <span v-if="text" class="check-text" :class="[textClass]">{{ text }}</span>
    </div>
  </a-button>
</template>

<style scoped lang="scss">
.check-btn {
  vertical-align: top;
  .check-icon {
    transition: all 0.3s ease;

    .anticon {
      transition: all 0.3s ease;
    }
  }

  .check-text {
    transition: color 0.3s ease;

    &.text-success {
      color: #52c41a !important;
    }

    &.text-error {
      color: #f5222d;
    }
  }

  &:hover {
    .check-text {
      &.text-success {
        color: #73d13d;
      }

      &.text-error {
        color: #ff4d4f;
      }
    }
  }
}
</style>
