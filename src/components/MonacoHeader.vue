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
  if (sidebarStore.activeTab.content === '') {
    message.warn('暂无内容')
    return
  }
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

const sortIcon = ref<IconStatus>(IconStatus.Default)
const sortClass = computed(() => ({
  'text-success': sortIcon.value === IconStatus.Success,
  'text-error': sortIcon.value === IconStatus.Error,
}))

// 字段排序
function fieldSortHandleMenuClick(e) {
  sortIcon.value = IconStatus.Loading
  setTimeout(() => {
    sortIcon.value = IconStatus.Default
  }, 2500)
  try {
    const content = sidebarStore.activeTab.content
    const jsonObj = JSON.parse(content)
    if (e.key === 'asc') {
      sidebarStore.activeTab.content = sortJson(jsonObj, 'asc')
    } else if (e.key === 'desc') {
      sidebarStore.activeTab.content = sortJson(jsonObj, 'desc')
    }
    message.success('排序成功')
  } catch (e) {
    ValidateJson()
    sortIcon.value = IconStatus.Error
    console.error(e)
  }
}

const moreIcon = ref<IconStatus>(IconStatus.Default)
const moreClass = computed(() => ({
  'text-success': moreIcon.value === IconStatus.Success,
  'text-error': moreIcon.value === IconStatus.Error,
}))

// 字段排序
function moreHandleMenuClick(e) {
  moreIcon.value = IconStatus.Loading
  setTimeout(() => {
    moreIcon.value = IconStatus.Default
  }, 2500)
  const content = sidebarStore.activeTab.content
  switch (e.key) {
    case 'unescape': {
      const msg = formatModelByUnEscapeJson(content)
      if (msg !== '') {
        message.error(msg)
        moreIcon.value = IconStatus.Error
        return
      }
      break
    }
    case 'del_comment': {
      if (!hasJsonComments(content)) {
        message.warn('未查找到注释标识符')
        moreIcon.value = IconStatus.Error
        return
      }
      sidebarStore.activeTab.content = removeJsonComments(content)
      break
    }
  }
  moreIcon.value = IconStatus.Success
}

// 解码 JSON 处理转义
// return '' 为正常
function formatModelByUnEscapeJson(jsonText: string): string {
  if (jsonText === '') {
    return '暂无数据'
  }
  const jsonStr = `"${jsonText}"`
  try {
    // 第一次将解析结果为去除转移后字符串
    const unescapedJson = JSON.parse(jsonStr)
    // 去除转义后的字符串解析为对象
    const unescapedJsonObject = JSON.parse(unescapedJson)
    // 判断是否为对象或数组
    if (!isArrayOrObject(unescapedJsonObject)) {
      return '不是有效的 Json 数据，无法进行解码操作'
    }
    sidebarStore.activeTab.content = JSON.stringify(unescapedJsonObject, null, 4)
  } catch (error) {
    console.error('formatModelByUnEscapeJson', error)
    return `尝试去除转义失败，${error.message}`
  }
  return ''
}
</script>

<template>
  <a-flex justify="space-between" align="center" class="h-9">
    <a-flex>
      <div class="dropdown-text ml-2">
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
                  <Icon icon="si:swap-horiz-line" class="text-17" />
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
      <div class="dropdown-text ml-2">
        <StatusIconButtonLink :icon="renderIconFontSize('mdi:magic', 17)" :status="formatStatus" text="格式化" @click="format" />
      </div>
      <div class="dropdown-text">
        <a-dropdown class="check-btn">
          <template #overlay>
            <a-menu @click="fieldSortHandleMenuClick">
              <a-menu-item key="asc">
                <div class="flex items-center">
                  <Icon icon="fluent:text-sort-ascending-20-filled" class="text-17" />
                  <span class="ml-1">字段升序</span>
                </div>
              </a-menu-item>
              <a-menu-item key="desc">
                <div class="flex items-center">
                  <Icon icon="fluent:text-sort-descending-20-filled" class="text-17" />
                  <span class="ml-1">字段降序</span>
                </div>
              </a-menu-item>
            </a-menu>
          </template>
          <div class="dropdown-btn">
            <span class="mr-1 check-icon pb-0.5">
              <Icon v-if="sortIcon === 'default'" icon="mi:sort" class="text-17" />
              <Icon v-else-if="sortIcon === 'success'" icon="icon-park-solid:success" class="text-17" style="color: #52c41a;" />
              <icon-park-solid-error v-else-if="sortIcon === 'error'" style="color: #f5222d;" />
            </span>
            <span class="check-text" :class="[sortClass]">排序</span>
          </div>
        </a-dropdown>
      </div>
      <div class="dropdown-text ml-2">
        <StatusIconButtonLink :icon="renderIconFontSize('mynaui:trash', 17)" :status="clearContentStatus" text="清空" @click="clearContent" />
      </div>
      <div class="dropdown-text">
        <a-dropdown class="check-btn">
          <template #overlay>
            <a-menu @click="moreHandleMenuClick">
              <a-menu-item key="unescape">
                <div class="flex items-center">
                  <Icon icon="iconoir:remove-link" class="text-17" />
                  <span class="ml-1">去除转义</span>
                </div>
              </a-menu-item>
              <a-menu-item key="del_comment">
                <div class="flex items-center">
                  <Icon icon="tabler:notes-off" class="text-17" />
                  <span class="ml-1">移除注释</span>
                </div>
              </a-menu-item>
            </a-menu>
          </template>
          <div class="dropdown-btn">
            <span class="mr-1 pb-0.5">
              <Icon v-if="moreIcon === 'default'" icon="mingcute:more-2-fill" class="text-17" />
              <Icon v-else-if="moreIcon === 'success'" icon="icon-park-solid:success" class="text-17" style="color: #52c41a;" />
              <icon-park-solid-error v-else-if="moreIcon === 'error'" style="color: #f5222d;" />
            </span>
            <span class="check-text " :class="[moreClass]">更多</span>
          </div>
        </a-dropdown>
      </div>
    </a-flex>
    <a-flex class="mr-4" />
  </a-flex>
</template>

<style lang="scss">
.dropdown-text {
  width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  @apply dark:text-white !important;
  .ant-btn-link {
    padding-right: 5px;
    padding-left: 5px;
    color: #000;
    border-radius: 6px;
    transition:
      color 0.3s ease,
      background-color 0.3s ease,
      box-shadow 0.3s ease;

    // 夜间模式
    @apply dark:text-white;
  }

  .dropdown-btn {
    @apply flex items-center w-auto px-2 rounded-md !important;
    @apply hover:bg-neutral-200 hover:dark:bg-zinc-800;
    padding: 6px 0;
  }
  .dropdown-btn:hover {
    @apply hover:bg-neutral-200 hover:dark:bg-zinc-800;
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
