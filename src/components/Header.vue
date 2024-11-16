<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { useNavigation } from '~/composables/router'
import { Editor } from '~/stores/sidebar'

const props = defineProps<{
  editor: Editor
}>()

const emit = defineEmits<{
  (e: 'update:editor', value: Editor): void
  (e: 'switch', value: Editor)
}>()

const router = useRouter()

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

function settingHandler() {
  useNavigation(router).navigateTo('/settings')
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
    <div class="flex items-center mr-1">
      <theme-toggle />
      <Icon icon="weui:setting-filled" style="font-size: 22px" class="rotation-icon ml-4 cursor-pointer text-neutral-700 dark:text-neutral-400" @click="settingHandler" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.editor-switch-container {
  @apply flex justify-between items-center px-3 bg-white dark:bg-dark text-xs h-10;
}

.editor-switch {
  @apply relative inline-flex rounded-full bg-gray-100 dark:bg-neutral-900 p-0.5;
}

.editor-button {
  width: 60px;
  font-size: 12px;
  padding: 5px 0;
  @apply relative z-10 font-medium rounded-full transition-all duration-200 ease-in-out outline-none focus:ring-0;
  @apply text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white active:bg-gray-300 dark:active:bg-neutral-800;

  &-active {
    @apply text-gray-800 dark:text-white bg-white dark:bg-neutral-800 shadow;
  }
}

.rotation-icon {
  transition: transform 1.5s ease-in-out;
}

.rotation-icon:hover {
  transform: rotate(360deg);
}
</style>
