<script setup lang="ts">
import {
  SettingOutlined,
} from '@ant-design/icons-vue'
import { ref } from 'vue'

import { useRouter } from 'vue-router'
import { renderIcon } from '~/composables/icon'
import { useNavigation } from '~/composables/router'
import { useTabsStore } from '~/stores/tabs'
// 在 setup 函数或 <script setup> 中
const router = useRouter()

const selectedKeys = ref<string[]>(['1'])
const collapsed = ref<boolean>(true)

onMounted(() => {
  // 设置 侧边栏宽度
  document.documentElement.style.setProperty('--sider-width', '58px')
  // 启动默认初始化一个 tab
  const tabsStore = useTabsStore()
  if (tabsStore.tabs.length === 0) {
    tabsStore.addTab('')
  }
})

const items = reactive([
  {
    key: 'textView',
    icon: renderIcon('icon-code'),
    label: '文本视图',
    title: '文本视图',
  },
  {
    key: 'setting',
    icon: () => h(SettingOutlined),
    label: '系统设置',
    title: '系统设置',
  },
],
)

function clickMenu(e) {
  useNavigation(router).navigateTo(e.key)
}

function siderCollapseFunc(collapsed) {
  if (collapsed === false) {
    document.documentElement.style.setProperty('--sider-width', '200px')
  }
  else {
    document.documentElement.style.setProperty('--sider-width', '58px')
  }
}

const footerStyle: CSSProperties = {
  height: '10px',
}
</script>

<template>
  <a-layout class="full-screen-div">
    <a-layout>
      <a-layout-sider
        v-model:collapsed="collapsed" class="sider"
        collapsible
        theme="light"
        @collapse="siderCollapseFunc"
      >
        <div class="avatar px-3 py-2">
          <a-avatar src="logo.png" />
        </div>
        <a-menu v-model:selected-keys="selectedKeys" :items="items" mode="inline" @click="clickMenu" />
      </a-layout-sider>
      <a-layout-content class="bg-white dark:bg-neutral-900">
        <slot />
      </a-layout-content>
    </a-layout>
    <a-layout-footer :style="footerStyle" class="!bg-white dark:!bg-neutral-900">
      Footer
    </a-layout-footer>
  </a-layout>
</template>

<style lang="scss">
.full-screen-div {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.sider {
  width: var(--sider-width) !important;
  min-width: var(--sider-width) !important;
  max-width: var(--sider-width) !important;
  border-inline-end: 1px solid rgba(5, 5, 5, 0.06);
}

.ant-layout-sider-trigger {
  width: var(--sider-width) !important;
}

.bb {
  background: antiquewhite !important;
}

.ant-layout-sider-children {
}
.ant-menu-light.ant-menu-root.ant-menu-vertical {
  border-inline-end: none !important;
  border: none !important;
}
</style>
