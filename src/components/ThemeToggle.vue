<script setup lang="ts">
function toggleTheme() {
  toggleDark()
  // isDark.value = !isDark.value
  console.log('夜间模式', isDark.value)
  // localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}
</script>

<template>
  <icon-font v-if="isDark" size="35" color="#fff" type="icon-yejian" @click="toggleTheme" />
  <icon-font v-else size="30" color="#fff" type="icon-taiyang" @click="toggleTheme" />
</template>

<style scoped>

</style>
