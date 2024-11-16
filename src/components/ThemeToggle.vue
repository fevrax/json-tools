<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '~/stores/settings'

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

function toggleDark() {
  settingsStore.toggleDark(!settingsStore.settings.darkMode)
}
</script>

<template>
  <Icon
    v-if="settings.darkMode"
    icon="fluent-emoji-flat:crescent-moon"
    style="font-size: 22px"
    class="text-2xl cursor-pointer moon-animation"
    @click="toggleDark"
  />
  <Icon
    v-else
    icon="fluent-emoji-flat:sun"
    style="font-size: 22px"
    class="cursor-pointer rotation-icon"
    @click="toggleDark"
  />
</template>

<style scoped>
.rotation-icon {
  transition: transform 1.5s ease-in-out;
}

.rotation-icon:hover {
  transform: rotate(360deg);
}

.moon-animation:hover {
  animation: rotate 1.5s infinite linear;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(20deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
</style>
