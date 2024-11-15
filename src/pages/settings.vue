<script setup lang="ts" generic="T extends any, O extends any">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '~/stores/settings'

defineOptions({
  name: 'SettingPage',
})

const router = useRouter()
const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

const fontSizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]

const editorLoadOptions = [
  { label: '本地嵌入', value: 'false' },
  { label: '远程CDN', value: 'true' },
]

function updateSettings(key: keyof typeof settings.value, value: any) {
  settingsStore.updateSetting(key, value)
}
</script>

<template>
  <div class="h-full bg-gray-50 dark:bg-neutral-900 transition-colors duration-300">
    <a-page-header
      title="插件设置"
      class="border-b dark:border-neutral-700 py-3 bg-white dark:bg-neutral-900 transition-colors duration-300"
      @back="() => useNavigation(router).goBack()"
    />

    <div class="py-1 max-w-3xl mx-auto h-full">
      <!-- 设置组 -->
      <div
        class="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 transform transition-all duration-300"
      >
        <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          显示设置
        </h2>

        <!-- 夜间模式 -->
        <div class="flex items-center justify-between py-3 border-b dark:border-neutral-700">
          <div>
            <div class="text-gray-900 dark:text-gray-100">
              夜间模式
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              切换深色主题以保护眼睛
            </div>
          </div>
          <a-switch
            v-model:checked="settings.darkMode"
            class="transition-opacity duration-200 hover:opacity-80"
          />
        </div>

        <!-- 编辑器加载方式 -->
        <div class="flex items-center justify-between py-3 border-b dark:border-neutral-700">
          <div>
            <div class="text-gray-900 dark:text-gray-100">
              编辑器加载方式
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              选择从本地加载或使用CDN(支持中文)
            </div>
          </div>
          <a-select
            v-model:value="settings.editorCDN"
            :options="editorLoadOptions"
            style="width: 120px"
            class="transition-opacity duration-200 hover:opacity-80"
          />
        </div>

        <!-- 字体大小 -->
        <div class="flex items-center justify-between py-3 border-b dark:border-neutral-700">
          <div>
            <div class="text-gray-900 dark:text-gray-100">
              字体大小
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              调整界面文字大小
            </div>
          </div>
          <a-radio-group
            v-model:checked="settings.fontSize"
            button-style="solid"
            class="transition-opacity duration-200 hover:opacity-80"
          >
            <a-radio-button
              v-for="option in fontSizeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-radio-button>
          </a-radio-group>
        </div>

        <!-- Tab展开 -->
        <div class="flex items-center justify-between py-3">
          <div>
            <div class="text-gray-900 dark:text-gray-100">
              展开Tab栏
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              设置Tab栏是否默认展开
            </div>
          </div>
          <a-switch
            v-model:checked="settings.expandTabs"
            class="transition-opacity duration-200 hover:opacity-80"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dark .ant-page-header-heading-title {
  color: #fff;
}

:deep(.ant-page-header-heading-title) {
  @apply text-neutral-700 dark:text-neutral-300;
}

:deep(.ant-switch-checked) {
  @apply bg-blue-500;
}

:deep(.ant-radio-button-wrapper-checked) {
  @apply bg-blue-500 border-blue-500 text-white;
}

:deep(.ant-radio-group-solid .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)) {
  @apply bg-blue-500 border-blue-500;
}
</style>
