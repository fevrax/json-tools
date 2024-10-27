<script setup lang="ts">
import { ref } from 'vue'
import { useSidebarStore } from '~/stores/sidebar'
import { useTabsStore } from '~/stores/tabs'

const tabsStore = useTabsStore()

const sidebarStore = useSidebarStore()

const collapsed = ref<boolean>(false)

onMounted(() => {
  // 设置 侧边栏宽度
  siderCollapseFunc(collapsed.value)
  // 启动默认初始化一个 tab
  if (tabsStore.tabs.length === 0) {
    tabsStore.addTab('')
  }
  for (let i = 0; i < 18; i++) {
    sidebarStore.addTab()
  }
})

function siderCollapseFunc(collapsed) {
  if (collapsed === false) {
    document.documentElement.style.setProperty('--sider-width', '180px')
  } else {
    document.documentElement.style.setProperty('--sider-width', '58px')
  }
}

function addItem() {
  sidebarStore.addTab('')
}

function selectItem(id) {
  sidebarStore.activeId = id
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
        <SidebarMenu :items="sidebarStore.menuItems" :selected-item-id="sidebarStore.activeId" @add="addItem" @select="selectItem" />
      </a-layout-sider>
      <a-layout-content class="bg-white dark:bg-neutral-900">
        <slot />
      </a-layout-content>
    </a-layout>
    <a-layout-footer v-if="false" :style="footerStyle" class="!bg-white dark:!bg-neutral-900">
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
//
.ant-layout-sider-trigger {
  width: var(--sider-width) !important;
}

.ant-layout-sider-children {
  overflow: hidden;
  padding-bottom: 48px !important;
}

.ant-menu-light.ant-menu-root.ant-menu-vertical {
  border-inline-end: none !important;
  border: none !important;
}

.ant-menu-item-icon {
  position: relative !important;
  left: -3px;
}
</style>
