<!-- components/ContextMenu.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  show: boolean
  x: number
  y: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', action: string): void
}>()

const menuRef = ref<HTMLDivElement | null>(null)

function closeMenu(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})
</script>

<template>
  <Transition name="fade">
    <div
      v-if="show"
      ref="menuRef"
      class="context-menu"
      :style="{ top: `${y}px`, left: `${x}px` }"
    >
      <div class="menu-item group" @click="emit('select', 'closeLeft')">
        <Icon icon="system-uicons:pull-left" class="text-17 mr-2" />
        <span>关闭左侧</span>
      </div>
      <div class="menu-item group" @click="emit('select', 'closeRight')">
        <Icon icon="system-uicons:pull-right" class="text-17 mr-2" />
        <span>关闭右侧</span>
      </div>
      <div class="menu-item group" @click="emit('select', 'closeOthers')">
        <Icon icon="basil:other-1-outline" class="text-17 mr-2" />
        <span>关闭其他</span>
      </div>
      <div class="menu-item group" @click="emit('select', 'closeAll')">
        <Icon icon="material-symbols-light:all-inclusive" class="text-17 mr-2" />
        <span>关闭所有</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.context-menu {
  @apply fixed bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700
  rounded-lg shadow-xl p-1 z-50 min-w-[120px] overflow-hidden;
  animation: scale-in 0.15s ease-out;
}

.menu-item {
  @apply flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200
  hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition-colors duration-150 ease-in-out cursor-pointer;
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
