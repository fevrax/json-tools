<script setup lang="ts">
import { computed } from 'vue'
import { Editor } from '~/stores/sidebar'

const props = defineProps<{
  editor: Editor
}>()

const emit = defineEmits<{
  (e: 'update:editor', value: Editor): void
  (e: 'switch', value: Editor)
}>()

const currentEditor = computed({
  get: () => props.editor,
})

const editors = [
  { value: Editor.Vanilla, label: '高级' },
  { value: Editor.Monaco, label: '性能' },
  { value: Editor.MonacoDiff, label: 'DIFF' },
]

function handleSwitch(value: Editor) {
  emit('switch', value)
}
</script>

<template>
  <div class="editor-switch-container select-none">
    <div class="editor-switch">
      <button
        v-for="editor in editors"
        :key="editor.value"
        class="editor-button"
        :class="{ 'editor-button-active': currentEditor === editor.value }"
        @click="handleSwitch(editor.value)"
      >
        {{ editor.label }}
      </button>
    </div>
    <theme-toggle />
  </div>
</template>

<style scoped lang="scss">
.editor-switch-container {
  @apply flex justify-between items-center py-1 px-3 bg-gray-100 dark:bg-neutral-900 text-xs;
}

.editor-switch {
  @apply relative inline-flex rounded-full bg-gray-200 dark:bg-neutral-800 p-0.5;
}

.editor-button {
  width: 60px;
  font-size: 12px;
  @apply relative z-10 px-2 py-1 font-medium rounded-full transition-all duration-200 ease-in-out outline-none focus:ring-0;
  @apply text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white active:bg-gray-300 dark:active:bg-gray-500;

  &-active {
    @apply text-gray-800 dark:text-white bg-white dark:bg-neutral-700 shadow;
  }
}
</style>
