<script setup lang="ts">
import { CheckOutlined, CloseOutlined, CopyOutlined, DeleteOutlined, DownOutlined, PlusOutlined, SwapOutlined } from '@ant-design/icons-vue'
import { useTabsStore } from '~/stores/tabs'

const emit = defineEmits<{
  (e: 'format', key: string, callback: (success: boolean) => void): void
}>()

const tabsStore = useTabsStore()

const addStatus = ref('default')
function addTab() {
  tabsStore.addTab('')
  addStatus.value = 'success'
  setTimeout(() => {
    addStatus.value = 'default'
  }, 2000)
}

enum IconStatus {
  Default = 'default',
  Success = 'success',
  Error = 'error',
}


// 复制
const copyIcon = ref<IconStatus>(IconStatus.Default)
const copyTextClass = computed(() => ({
  'text-success': copyIcon.value === IconStatus.Success,
  'text-error': copyIcon.value === IconStatus.Error,
}))
function copy() {
  const tab = tabsStore.getActiveTab()
  setTimeout(() => {
    copyIcon.value = IconStatus.Default
  }, 2500)
  if (tab === undefined || tab.content === '') {
    copyIcon.value = IconStatus.Error
  }
  else {
    copyText(tabsStore.getActiveTab()?.content)
    copyIcon.value = IconStatus.Success
  }
}

// 复制到剪贴板
function copyText(text: string) {
  navigator.clipboard.writeText(text)
}

function copySubMenuClickHandle(e) {
  // eslint-disable-next-line no-console
  console.log(e)
}

// 格式化
const formatStatus = ref(IconStatus.Default)
function format() {
  emit('format', tabsStore.activeKey, (success) => {
    formatStatus.value = success ? IconStatus.Success : IconStatus.Error
    setTimeout(() => {
      formatStatus.value = IconStatus.Default
    }, 2500)
  })
}


// 清空内容
const clearContentStatus = ref(IconStatus.Default)
function clearContent() {
  tabsStore.clearContent(tabsStore.activeKey)
  clearContentStatus.value = IconStatus.Success
  setTimeout(() => {
    clearContentStatus.value = IconStatus.Default
  }, 2500)
}
</script>

<template>
  <a-flex justify="space-between" align="center" class="h-10">
    <a-flex>
      <div class="dropdown-text dark:!text-white ml-2">
        <StatusIconButtonLink :icon="PlusOutlined" :status="addStatus" text="新增" @click="addTab" />
      </div>
      <div class="dropdown-text dark:!text-white ml-2">
        <a-dropdown-button type="link" placement="bottom" class="check-btn" @click="copy">
          <span class="mr-1 check-icon">
            <CopyOutlined v-if="copyIcon === 'default'" />
            <CheckOutlined v-else-if="copyIcon === 'success'" style="color: #52c41a;" />
            <CloseOutlined v-else-if="copyIcon === 'error'" style="color: #f5222d;" />
          </span>
          <span class="check-text " :class="[copyTextClass]">复制</span>
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
        <StatusIconButtonLink :icon="SwapOutlined" :status="formatStatus" text="格式化" @click="format" />
      </div>
      <div class="dropdown-text dark:!text-white ml-2">
        <StatusIconButtonLink :icon="DeleteOutlined" :status="clearContentStatus" text="清空" @click="clearContent" />
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

  .check-btn {
    .check-icon {
      transition: all 0.3s ease;

      .anticon {
        transition: all 0.3s ease;
      }
    }

    .check-text {
      transition: color 0.3s ease;

      &.text-success {
        color: #52c41a !important;
      }

      &.text-error {
        color: #f5222d;
      }
    }

    &:hover {
      .check-text {
        &.text-success {
          color: #73d13d;
        }

        &.text-error {
          color: #ff4d4f;
        }
      }
    }
  }

  // 成功状态图标样式
  .anticon-check {
    color: #52c41a;
    transform: scale(1.1);
  }

  // 错误状态图标样式
  .anticon-close {
    color: #f5222d;
    transform: scale(1.1);
  }
}
</style>
