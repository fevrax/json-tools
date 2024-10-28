
<script setup lang="ts">
import { ref, computed } from 'vue'
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
  { value: Editor.Monaco, label: '性能' },
  { value: Editor.Vanilla, label: '高级' },
]

const handleSwitch = (value: Editor) => {
  if (value !== currentEditor.value) {
    currentEditor.value = value
  }
}
</script>

<template>
  <div class="editor-switch-container">
    <div class="editor-switch">
      <button
        v-for="editor in editors"
        :key="editor.value"
        @click="handleSwitch(editor.value)"
        class="editor-button"
        :class="{ 'editor-button-active': currentEditor === editor.value }"
      >
        {{ editor.label }}
      </button>
    </div>
    <theme-toggle />
  </div>
</template>

<style scoped lang="scss">
.editor-switch-container {
  @apply flex justify-between items-center py-2 px-3 bg-gray-100 dark:bg-gray-800;
}

.editor-switch {
  @apply relative inline-flex rounded-full bg-gray-200 dark:bg-gray-700 p-0.5;
}

.editor-button {
  @apply relative z-10 px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ease-in-out outline-none focus:ring-0;
  @apply text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white active:bg-gray-300 dark:active:bg-gray-500;

  &-active {
    @apply text-gray-800 dark:text-white bg-white dark:bg-gray-600 shadow;
  }
}
</style>
