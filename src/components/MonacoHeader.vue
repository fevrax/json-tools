<script setup lang="ts">
import { DownOutlined } from '@ant-design/icons-vue'
import { Icon } from '@iconify/vue'
import { message } from 'ant-design-vue'
import { useSidebarStore } from '~/stores/sidebar'

const emit = defineEmits<{
  (e: 'format', callback: (success: boolean) => void): void
  (e: 'validate', callback: (success: boolean) => void): void
}>()

const sidebarStore = useSidebarStore()

enum IconStatus {
  Default = 'default',
  Success = 'success',
  Loading = 'loading',
  Error = 'error',
}
// 格式化
const formatStatus = ref(IconStatus.Default)
const validateStatus = ref(IconStatus.Default)

// 复制
const copyIcon = ref<IconStatus>(IconStatus.Default)
const copyTextClass = computed(() => ({
  'text-success': copyIcon.value === IconStatus.Success,
  'text-error': copyIcon.value === IconStatus.Error,
}))
function copy() {
  const tab = sidebarStore.activeTab
  setTimeout(() => {
    copyIcon.value = IconStatus.Default
  }, 2500)
  if (tab.content === '') {
    copyIcon.value = IconStatus.Error
    message.warn('暂无内容')
  } else {
    copyText(sidebarStore.activeTab?.content)
    copyIcon.value = IconStatus.Success
  }
}

// 复制到剪贴板
function copyText(text: string) {
  navigator.clipboard.writeText(text)
}

async function copySubMenuClickHandle(e) {
  const tab = sidebarStore.activeTab
  if (tab.content === '') {
    message.warn('暂无内容')
    return
  }
  if (tab.content === '') {
    copyIcon.value = IconStatus.Error
    return
  }

  // 验证内容是否正确，异步方法
  ValidateJson()
  let success = false
  for (let i = 0; i < 100; i++) {
    if (validateStatus.value === IconStatus.Loading) {
      await sleep(100)
    } else if (validateStatus.value === IconStatus.Success) {
      success = true
      break
    } else if (validateStatus.value === IconStatus.Error) {
      break
    }
  }
  if (!success) {
    message.warn('复制失败，内容格式错误，请检查！')
    return
  }
  const content = sidebarStore.activeTab.content
  try {
    switch (e.key) {
      case 'compressedCopy':
        copyText(JSON.stringify(JSON.parse(content)))
        break
      case 'escapeCopy':
        copyText(escapeJson(sidebarStore.activeTab?.content))
        break
    }
    copyIcon.value = IconStatus.Success
  } catch {
    copyIcon.value = IconStatus.Error
  } finally {
    setTimeout(() => {
      copyIcon.value = IconStatus.Default
      validateStatus.value = IconStatus.Default
    }, 2500)
  }
}

// 验证编辑器内容格式并格式化编辑器内容
function format() {
  formatStatus.value = IconStatus.Loading
  emit('format', (success) => {
    formatStatus.value = success ? IconStatus.Success : IconStatus.Error
    setTimeout(() => {
      formatStatus.value = IconStatus.Default
    }, 2500)
  })
}

// 验证编辑器内容格式
function ValidateJson() {
  validateStatus.value = IconStatus.Loading
  emit('validate', (success) => {
    validateStatus.value = success ? IconStatus.Success : IconStatus.Error
    setTimeout(() => {
      validateStatus.value = IconStatus.Default
    }, 2500)
  })
}

// 清空内容
const clearContentStatus = ref(IconStatus.Default)
function clearContent() {
  sidebarStore.clearContent(sidebarStore.activeId)
  clearContentStatus.value = IconStatus.Success
  setTimeout(() => {
    clearContentStatus.value = IconStatus.Default
  }, 2500)
}
</script>

<template>
  <a-flex justify="space-between" align="center" class="h-9">
    <a-flex>
      <div class="dropdown-text dark:!text-white ml-2">
        <a-dropdown-button type="link" placement="bottom" class="check-btn" @click="copy">
          <div class="flex items-center">
            <span class="mr-1 check-icon pb-0.5">
              <Icon v-if="copyIcon === 'default'" icon="si:copy-line" class="text-17" />
              <Icon v-else-if="copyIcon === 'success'" icon="icon-park-solid:success" class="text-17" style="color: #52c41a;" />
              <icon-park-solid-error v-else-if="copyIcon === 'error'" style="color: #f5222d;" />
            </span>
            <span class="check-text " :class="[copyTextClass]">复制</span>
          </div>
          <template #overlay>
            <a-menu @click="copySubMenuClickHandle">
              <a-menu-item key="compressedCopy">
                <div class="flex items-center">
                  <Icon icon="f7:rectangle-compress-vertical" class="text-17" />
                  <span class="ml-1">压缩后复制</span>
                </div>
              </a-menu-item>
              <a-menu-item key="escapeCopy">
                <div class="flex items-center">
                  <Icon icon="si:swap-horiz-line" class="text-17 " />
                  <span class="ml-1">转义后复制</span>
                </div>
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
        <StatusIconButtonLink :icon="renderIconFontSize('mdi:magic', 17)" :status="formatStatus" text="格式化" @click="format" />
      </div>
      <div class="dropdown-text dark:!text-white">
        <StatusIconButtonLink :icon="renderIconFontSize('mynaui:trash', 17)" :status="clearContentStatus" text="清空" @click="clearContent" />
      </div>
    </a-flex>
    <a-flex class="mr-4">
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
    @apply dark:bg-zinc-800;
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
