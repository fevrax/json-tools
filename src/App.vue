<script setup lang="ts">
import { theme } from 'ant-design-vue'
import { isDark } from '~/composables'
</script>

<template>
  <main font-sans>
    <a-config-provider
      :locale="locale"
      :theme="{
        algorithm: isDark ? theme.darkAlgorithm : null,
        token: {
          colorPrimary: '#9a38fc',
          wireframe: false,
        },
      }"
    >
      <layout>
        <RouterView />
      </layout>
    </a-config-provider>
  </main>
</template>
