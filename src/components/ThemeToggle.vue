<script setup lang="ts">

import {
  SunnyOutline,
  MoonOutline
} from '@vicons/ionicons5'
import {toggleDark} from "~/composables";


const toggleTheme = () => {
  toggleDark()
  // isDark.value = !isDark.value
  console.log("夜间模式",isDark.value)
  // localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

</script>

<template>
  <n-icon v-if="isDark" size="20" color="#fff" @click="toggleTheme">
    <MoonOutline/>
  </n-icon>
  <n-icon v-else size="20" color="rgb(51, 54, 57)" @click="toggleTheme">
    <SunnyOutline/>
  </n-icon>
</template>

<style scoped>

</style>
