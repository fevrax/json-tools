<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { onMounted, ref } from 'vue'
import { useSettingsStore } from '~/stores/settings'
import { useSidebarStore } from '~/stores/sidebar'
import { useTabsStore } from '~/stores/tabs'

const tabsStore = useTabsStore()
const sidebarStore = useSidebarStore()

const settingsStore = useSettingsStore()

const collapsed = ref<boolean>(!settingsStore.settings.expandTabs)

onMounted(() => {
  siderCollapseFunc(collapsed.value)
  if (tabsStore.tabs.length === 0) {
    tabsStore.addTab('')
  }
  if (sidebarStore.menuItems.length === 0) {
    sidebarStore.addTab('')
  }
  if (window.utools) {
    window.utools.onPluginEnter(({ code, type, payload, option }) => {
      if (type === 'regex') {
        sidebarStore.activeTab.content = payload
      }
    })
  }
})

function siderCollapseFunc(changeCollapsed) {
  collapsed.value = changeCollapsed
  // const isNarrow = computed(() => sidebarWidth.value 也需要修改
  document.documentElement.style.setProperty('--sider-width', changeCollapsed ? '70px' : '130px')
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
        v-model:collapsed="collapsed"
        class="sider"
        collapsible
        theme="light"
        @collapse="siderCollapseFunc"
      >
        <div class="h-10 border-b dark:border-neutral-800">
          <transition name="fade">
            <div v-if="collapsed" class="w-full flex items-center justify-center px-3 pt-1 pb-2 select-none absolute top-0">
              <a-avatar class="avatar-transition" src="logo.png" @click="addItem" />
            </div>
          </transition>
          <transition name="fade">
            <div v-if="!collapsed" class="w-full flex items-center px-3 pt-1 pb-2 select-none justify-between absolute top-0">
              <a-avatar class="avatar-transition" src="logo.png" @click="addItem" />
              <div v-show="!collapsed" class="flex justify-center items-center rounded-lg px-1 py-1 hover:bg-gray-200 dark:hover:bg-neutral-800 cursor-pointer transition-all duration-300 ease-in-out" @click="addItem">
                <Icon class="text-xl !text-neutral-600" icon="mingcute:add-line" />
              </div>
            </div>
          </transition>
        </div>
        <SidebarMenu ref="sidebarRef" @dblclick="toggleCollapsed" @toggle-collapsed="siderCollapseFunc(false)" />
      </a-layout-sider>
      <a-layout-content class="bg-white dark:bg-dark">
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
  position: relative;
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

.avatar-transition {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: scale(1.1) rotate(12deg);
  }

  &:active {
    transform: scale(0.95) rotate(-12deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
