<script setup lang="ts">
import { CheckOutlined } from '@ant-design/icons-vue'
import { Radio } from 'ant-design-vue'
import { computed } from 'vue'
import { Editor } from '~/stores/sidebar'

const props = defineProps<{
  editor: Editor
}>()

const emit = defineEmits<{
  (e: 'update:editor', value: Editor): void
}>()

const currentEditor = computed({
  get: () => props.editor,
  set: value => emit('update:editor', value),
})

const editors = [
  { value: Editor.Monaco, label: '性能模式' },
  { value: Editor.Vanilla, label: '高级模式' },
]
</script>

<template>
  <div class="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-gray-800 shadow-sm">
    <Radio.Group v-model:value="currentEditor" button-style="solid" size="small" class="editor-switcher">
      <Radio.Button v-for="editor in editors" :key="editor.value" :value="editor.value">
        <span class="flex items-center space-x-1">
          <CheckOutlined v-if="currentEditor === editor.value" class="text-xs" />
          <span>{{ editor.label }}</span>
        </span>
      </Radio.Button>
    </Radio.Group>
    <theme-toggle />
  </div>
</template>

<style scoped lang="scss">
.editor-switcher {
  @apply text-sm font-medium transition-all duration-200 ease-in-out;
  @apply text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700;
  @apply border-gray-200 dark:border-gray-600;
  @apply hover:text-blue-500 dark:hover:text-blue-400;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400;

  &::before {
    @apply bg-gray-200 dark:bg-gray-600;
  }

  &-checked {
    @apply text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900;
    @apply border-blue-500 dark:border-blue-400;

    &::before {
      @apply bg-blue-500 dark:bg-blue-400;
    }
  }
}
</style>
