<script setup lang="ts">
import type { MenuOption } from 'naive-ui'
import {
  CodeSlashOutline,
  SettingsOutline,
  // LogoDropbox
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { RouterLink } from 'vue-router'

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const collapsed = ref<boolean>(true)

const menuOptions: MenuOption[] = [
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: '/',
            params: {
              lang: 'zh-CN',
            },
          },
        },
        { default: () => '文本视图' },
      ),
    key: 'text-view',
    icon: renderIcon(CodeSlashOutline),
  },
  // {
  //   label: 'AI 工具箱',
  //   key: 'ai-toolbox',
  //   icon: renderIcon(LogoDropbox),
  //   disabled: true,
  // },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: '/setting',
            params: {
              lang: 'zh-CN',
            },
          },
        },
        { default: () => '设置' },
      ),
    key: 'setting',
    icon: renderIcon(SettingsOutline),
  },
]
</script>

<template>
  <div class="full-screen-div">
    <Header />
    <!--  侧边栏  -->
    <n-layout class="h-full" has-sider position="static">
      <n-layout-sider
        class="h-full"
        bordered
        collapse-mode="width"
        :collapsed-width="58"
        :width="140"
        :collapsed="collapsed"
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
      >
        <n-menu
          v-model:value="activeKey"
          :collapsed="collapsed"
          :collapsed-width="58"
          :collapsed-icon-size="20"
          :options="menuOptions"
          default-value="text-view"
        />
      </n-layout-sider>
      <n-layout>
        <slot />
      </n-layout>
    </n-layout>
  </div>
</template>

<style scoped>
.full-screen-div {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
