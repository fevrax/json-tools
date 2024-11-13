<script setup lang="ts">
import { ref } from 'vue'
import { useSidebarStore } from '~/stores/sidebar'
import { useTabsStore } from '~/stores/tabs'

const tabsStore = useTabsStore()

const sidebarStore = useSidebarStore()

const collapsed = ref<boolean>(true)

onMounted(() => {
  // 设置 侧边栏宽度
  siderCollapseFunc(collapsed.value)
  // 启动默认初始化一个 tab
  if (tabsStore.tabs.length === 0) {
    tabsStore.addTab('')
  }
  // 启动默认初始化一个 tab
  if (sidebarStore.menuItems.length === 0) {
    sidebarStore.addTab('')
  }
  if (window.utools) {
    window.utools.onPluginEnter(({ code, type, payload, option }) => {
      if (type === 'regex') {
        // 匹配内容则写入到编辑器
        sidebarStore.activeTab.content = payload
      }
    })
  }
})

function siderCollapseFunc(changeCollapsed) {
  collapsed.value = changeCollapsed
  if (changeCollapsed === false) {
    document.documentElement.style.setProperty('--sider-width', '150px')
  } else {
    document.documentElement.style.setProperty('--sider-width', '60px')
  }
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value
  siderCollapseFunc(collapsed.value)
}

const sidebarRef = ref(null)

function addItem() {
  sidebarRef.value.addNewMenuItem()
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
        <div class="flex items-center justify-between px-3 pt-3 pb-2 select-none">
          <a-avatar src="logo.png" @click="addItem" />
          <div v-show="!collapsed" class="flex justify-center rounded-lg px-2 py-1 hover:bg-gray-200 dark:hover:bg-neutral-800 cursor-pointer" @click="addItem">
            <Iconify class="text-xl" icon="mingcute:add-line" />
          </div>
        </div>
        <SidebarMenu ref="sidebarRef" class="mt-1" @dblclick="toggleCollapsed" @toggle-collapsed="siderCollapseFunc(false)" />
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

.ant-layout-sider-trigger {
  overflow-y: hidden;
  width: var(--sider-width) !important;
}

.ant-layout-sider-children {
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
