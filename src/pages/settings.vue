<script setup lang="ts" generic="T extends any, O extends any">
import { Button, message, notification } from 'ant-design-vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '~/stores/settings'

defineOptions({
  name: 'SettingPage',
})

const router = useRouter()
const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

const editorLoadOptions = [
  { label: '本地嵌入', value: 'false' },
  { label: '远程CDN', value: 'true' },
]

function reloadApp() {
  if (window.utools) {
    console.log(window.utools)
    message.success('重启插件后生效')
    return undefined
  }
  notification.open({
    message: '配置已保存',
    description: '编辑器加载方式已更改，请重新加载或刷新后生效',
    placement: 'bottomRight',
    btn: () =>
      h(
        Button,
        {
          type: 'primary',
          size: 'small',
          onClick: () => location.reload()
          ,
        },
        { default: () => '重新加载' },
      ),
  })
}

function editorCDNChange(value: string) {
  if (value !== settings.editorCDN) {
    reloadApp()
  }
}
</script>

<template>
  <div class="h-full bg-gray-50 dark:bg-dark transition-colors duration-300">
    <a-page-header
      title="插件设置"
      class="h-10 border-b dark:border-neutral-800 py-0.5 bg-white dark:bg-neutral-900 transition-colors duration-300"
      @back="() => useNavigation(router).goBack()"
    />

    <div class="max-w-4xl mx-auto h-full">
      <!-- 设置组 -->
      <div
        class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-6 transform transition-all duration-300 h-full"
      >
        <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          常规设置
        </h2>

        <!-- 夜间模式 -->
        <div class="flex items-center justify-between py-3 border-b dark:border-neutral-700">
          <div>
            <div class="text-gray-900 dark:text-gray-100">
              深色模式
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

        <!-- Tab展开 -->
        <div class="flex items-center justify-between py-3  border-b dark:border-neutral-700">
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

        <!-- 编辑器加载方式 -->
        <div class="flex items-center justify-between py-3">
          <div>
            <div class="text-gray-900 dark:text-gray-100">
              编辑器加载方式
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              1. 本地加载，首屏加载速度快，暂不支持中文。
              <br>
              2. CDN(需联网)，首屏加载速度慢，支持中文。
            </div>
          </div>
          <a-select
            v-model:value="settings.editorCDN"
            :options="editorLoadOptions"
            style="width: 120px"
            class="transition-opacity duration-200 hover:opacity-80"
            @change="editorCDNChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.ant-page-header-heading-title) {
  @apply text-neutral-700 dark:text-neutral-300 text-lg;
}

:deep(.ant-radio-button-wrapper-checked) {
  @apply bg-blue-500 border-blue-500 text-white;
}

:deep(.ant-radio-group-solid .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)) {
  @apply bg-blue-500 border-blue-500;
}
</style>
