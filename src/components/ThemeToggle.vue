<script setup lang="ts">

import { Icon } from '@iconify/vue'

function toggleTheme() {
  toggleDark()
  console.log('夜间模式', isDark.value)
}
</script>

<template>
  <Icon v-if="isDark" icon="fluent-emoji-flat:crescent-moon" class="text-xl" @click="toggleTheme" />
  <Icon v-else icon="fluent-emoji-flat:sun" class="text-xl" @click="toggleTheme" />
</template>

<style scoped>

</style>
