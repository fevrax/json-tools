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
  <Icon v-if="settings.darkMode" icon="fluent-emoji-flat:crescent-moon" class="text-xl cursor-pointer" @click="toggleDark" />
  <Icon v-else icon="fluent-emoji-flat:sun" class="text-xl cursor-pointer" @click="toggleDark" />
</template>

<style scoped>

</style>
