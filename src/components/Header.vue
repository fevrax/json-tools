<script setup lang="ts">
import { CopyOutlined, DownOutlined, PlusOutlined, SwapOutlined } from '@ant-design/icons-vue'
import { useTabsStore } from '~/stores/tabs'

const emit = defineEmits(['format'])

const tabsStore = useTabsStore()

function addTab() {
  tabsStore.addTab('')
}

function copy() {
  copyText(tabsStore.getActiveTab()?.content)
}

function format() {
  emit('format', tabsStore.activeKey)
}

// 复制到剪贴板
function copyText(text: string) {
  navigator.clipboard.writeText(text)
}

function copySubMenuClickHandle(e) {
  // eslint-disable-next-line no-console
  console.log(e)
}
</script>

<template>
  <a-flex justify="space-between" align="center" class="h-10">
    <a-flex>
      <div class="dropdown-text dark:!text-white ml-2">
        <a-button type="link" class="!mr-2" @click="addTab">
          <span class="mr-1"><PlusOutlined /></span> 新增
        </a-button>
      </div>
      <div class="dropdown-text dark:!text-white ml-2">
        <a-dropdown-button type="link" placement="bottom" @click="copy">
          <span class="mr-1"><CopyOutlined /></span>复制
          <template #overlay>
            <a-menu @click="copySubMenuClickHandle">
              <a-menu-item key="compressedCopy">
                <CopyOutlined />
                压缩后复制
              </a-menu-item>
              <a-menu-item key="escapeCopy">
                <CopyOutlined />
                转义后复制
              </a-menu-item>
            </a-menu>
          </template>
          <template #icon>
            <div>
              <DownOutlined />
            </div>
          </template>
        </a-dropdown-button>
      </div>
      <div class="dropdown-text dark:!text-white ml-2">
        <a-button type="link" class="!mr-2" @click="format">
          <span class="mr-1"><SwapOutlined /></span>格式化
        </a-button>
      </div>
    </a-flex>
    <a-flex class="mr-4">
      <theme-toggle />
    </a-flex>
  </a-flex>
</template>

<style lang="scss">
.dropdown-text {
  .ant-btn-link {
    padding-right: 5px;
    padding-left: 5px;
    color: #333;
    border-radius: 6px;
    transition:
      color 0.3s ease,
      background-color 0.3s ease,
      box-shadow 0.3s ease;

    // 夜间模式
    @apply dark:text-white;
  }

  .ant-btn-link:hover {
    color: #000;
    background-color: rgb(232, 232, 232);
    border-radius: 6px;
    // 夜间模式
    @apply dark:text-white;
    @apply dark:!bg-zinc-800;
  }

  .ant-dropdown-trigger {
    width: 25px;
  }
}
</style>
