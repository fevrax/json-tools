<script setup lang="ts">
import { theme } from 'ant-design-vue'
import { useSettingsStore } from '~/stores/settings'

const settingsStore = useSettingsStore()
</script>

<template>
  <main font-sans>
    <a-config-provider
      :locale="locale"
      :theme="{
        algorithm: settingsStore.settings.darkMode ? theme.darkAlgorithm : null,
        token: {
          colorPrimary: '#9a38fc',
          wireframe: false,
        },
      }"
    >
      <a-app>
        <layout>
          <RouterView />
        </layout>
      </a-app>
    </a-config-provider>
  </main>
</template>
