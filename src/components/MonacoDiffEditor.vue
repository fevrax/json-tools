<script setup lang="ts">
import { Icon } from '@iconify/vue'
import loader from '@monaco-editor/loader'
import { message } from 'ant-design-vue'
import * as monaco from 'monaco-editor'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useSettingsStore } from '~/stores/settings'
import { jsonParseError } from '~/utils/json'

const props = defineProps<{
  originalValue: string // 原始文本
  modifiedValue: string // 修改后的文本
  language: string
  theme: string // vs-light|vs-dark
  fontSize?: number
}>()
const emit = defineEmits<{
  (e: 'update:originalValue', value: string): void
  (e: 'update:modifiedValue', value: string): void
}>()
const settingsStore = useSettingsStore()
// 编辑器容器
const diffEditorContainer = ref<HTMLElement | null>(null)
const editorHeight = ref('100%')

// 编辑器对象
let diffEditor: monaco.editor.IStandaloneDiffEditor | null = null
let originalEditor: monaco.editor.IStandaloneCodeEditor | null = null
let modifiedEditor: monaco.editor.IStandaloneCodeEditor | null = null

// 编辑器默认字体大小
const fontSize = ref(props.fontSize || 14)

// 创建差异编辑器实例
function createDiffEditor() {
  if (settingsStore.settings.editorCDN === 'true') {
    loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs' } })
    loader.config({ 'vs/nls': { availableLanguages: { '*': 'zh-cn' } } })
  } else {
    loader.config({ monaco })
  }
  loader.init().then((monacoInstance) => {
    if (diffEditorContainer.value) {
      // 创建差异编辑器
      diffEditor = monacoInstance.editor.createDiffEditor(diffEditorContainer.value, {
        originalEditable: true, // 允许编辑原始文本
        renderSideBySide: true, // 并排显示
        useInlineViewWhenSpaceIsLimited: false, // 当空间有限时使用InlineView
        theme: props.theme || 'vs-light',
        fontSize: fontSize.value,
        minimap: { enabled: true },
        mouseWheelZoom: true, // 启用鼠标滚轮缩放
        scrollBeyondLastLine: false,
        diffWordWrap: 'on',
        automaticLayout: true, // 自动布局
        suggestOnTriggerCharacters: true, // 在触发字符时显示建议
        acceptSuggestionOnCommitCharacter: true, // 接受关于提交字符的建议
        acceptSuggestionOnEnter: 'smart', // 按Enter键接受建议
        wordWrap: 'on', // 自动换行
        autoSurround: 'never', // 是否应自动环绕选择
        cursorBlinking: 'Solid', // 光标动画样式
        cursorSmoothCaretAnimation: true, // 是否启用光标平滑插入动画  当你在快速输入文字的时候 光标是直接平滑的移动还是直接"闪现"到当前文字所处位置
        cursorStyle: 'UnderlineThin', // "Block"|"BlockOutline"|"Line"|"LineThin"|"Underline"|"UnderlineThin" 光标样式
        cursorSurroundingLines: 0, // 光标环绕行数 当文字输入超过屏幕时 可以看见右侧滚动条中光标所处位置是在滚动条中间还是顶部还是底部 即光标环绕行数 环绕行数越大 光标在滚动条中位置越居中
        cursorSurroundingLinesStyle: 'all', // "default" | "all" 光标环绕样式
        links: true, // 是否点击链接
      })

      // 设置模型
      const originalModel = monacoInstance.editor.createModel(props.originalValue, props.language || 'json')
      const modifiedModel = monacoInstance.editor.createModel(props.modifiedValue, props.language || 'json')

      diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel,
      })

      // 获取两个编辑器实例
      originalEditor = diffEditor.getOriginalEditor()
      modifiedEditor = diffEditor.getModifiedEditor()

      // 监听原始编辑器内容变化
      originalEditor.onDidChangeModelContent(() => {
        emit('update:originalValue', originalEditor!.getValue())
      })

      // 监听修改编辑器内容变化
      modifiedEditor.onDidChangeModelContent(() => {
        emit('update:modifiedValue', modifiedEditor!.getValue())
      })

      // 初始调整大小
      adjustEditorHeight()
    }
  })
}

// 调整编辑器高度
function adjustEditorHeight() {
  if (diffEditorContainer.value) {
    const containerRect = diffEditorContainer.value.getBoundingClientRect()
    const containerHeight = window.innerHeight - containerRect.top - 2
    editorHeight.value = `${containerHeight}px`
    if (diffEditor) {
      diffEditor.layout()
    }
  }
}

// 监听窗口大小变化
function handleResize() {
  if (diffEditor) {
    adjustEditorHeight()
  }
}

// 更新字体大小
function updateFontSize(size: number) {
  if (diffEditor) {
    diffEditor.updateOptions({ fontSize: size })
  }
}

// 格式化文本
function format(editor: monaco.editor.IStandaloneCodeEditor): boolean {
  if (editor.getValue() === '') {
    message.warn('暂无内容')
    return false
  }
  editor.getAction('editor.action.formatDocument').run()
  return true
}

// 格式化原始文本
function formatOriginal(callback: (success: boolean) => void) {
  callback(format(originalEditor))
}

// 验证内容
function validateContent(editor: monaco.editor.IStandaloneCodeEditor): boolean {
  if (editor.getValue() === '') {
    message.warn('暂无内容')
    return false
  }
  const jsonErr = jsonParseError(editor.getValue())
  if (jsonErr) {
    message.error(`第 ${jsonErr.line} 行，第 ${jsonErr.column} 列，格式错误: ${jsonErr.message}`)
    return false
  }
  return true
}

// 验证原始文本
function validateOriginal(callback: (success: boolean) => void) {
  const success = validateContent(originalEditor)
  callback(success)
}

// 切换对比视图模式
function swapContent() {
  const originValue = originalEditor?.getValue()
  const modifiedValue = modifiedEditor?.getValue()
  originalEditor?.setValue(modifiedValue)
  modifiedEditor?.setValue(originValue)
}

// 切换对比视图模式
const isDiffInline = ref(false)
function toggleDiffViewType() {
  isDiffInline.value = !isDiffInline.value
  diffEditor?.updateOptions({
    renderSideBySide: !isDiffInline.value,
  })
}

// 导航到上一个差异
function goToPreviousDiff() {
  diffEditor?.goToDiff('previous')
}

// 导航到下一个差异
function goToNextDiff() {
  diffEditor?.goToDiff('next')
}

// region 监听属性变化
watch(() => props.originalValue, (newValue) => {
  if (!originalEditor || newValue === originalEditor.getValue())
    return
  const position = originalEditor.getPosition()
  originalEditor.setValue(newValue)
  if (position) {
    originalEditor.setPosition(position)
  }
})

watch(() => props.modifiedValue, (newValue) => {
  if (!modifiedEditor || newValue === modifiedEditor.getValue())
    return
  const position = modifiedEditor.getPosition()
  modifiedEditor.setValue(newValue)
  if (position) {
    modifiedEditor.setPosition(position)
  }
})

watch(() => props.theme, (newValue) => {
  diffEditor?.updateOptions({
    theme: newValue,
  })
})

watch(() => props.fontSize, (newValue) => {
  updateFontSize(newValue)
})

onMounted(() => {
  createDiffEditor()
  window.addEventListener('resize', handleResize)

  const resizeObserver = new ResizeObserver(() => {
    adjustEditorHeight()
  })
  if (diffEditorContainer.value) {
    resizeObserver.observe(diffEditorContainer.value)
  }
})

onUnmounted(() => {
  if (diffEditor) {
    diffEditor.dispose()
  }
  window.removeEventListener('resize', handleResize)
})
// endregion
</script>

<template>
  <div class="monaco-diff-editor-container">
    <!-- 工具栏 -->
    <div class="flex justify-between items-center border-b dark:border-b-neutral-800 mb-2">
      <div class="left-tools ml-2">
        <a-space>
          <div class="flex items-center justify-center">
            <div class="next-btn" @click="goToPreviousDiff">
              <Icon icon="iconamoon:arrow-up-1-bold" class="inline-block" />
            </div>
            <div class="next-btn" @click="goToNextDiff">
              <Icon icon="iconamoon:arrow-down-1-bold" class="inline-block" />
            </div>
          </div>
          <!-- 原始编辑器工具栏 -->
          <div class="original-tools">
            <MonacoHeader @format="formatOriginal" @validate="validateOriginal" />
          </div>
        </a-space>
      </div>
      <div class="right-tools mr-2">
        <a-button type="text" @click="swapContent">
          <template #icon>
            <Icon icon="fluent:arrow-swap-24-filled" class="inline-block mr-2" />
          </template>
          <span>交换</span>
        </a-button>
        <a-tooltip :title="isDiffInline ? '切换为对比视图' : '切换为内联视图'" color="rgba(154,56,252,0.7)">
          <a-button type="text" @click="toggleDiffViewType">
            <template #icon>
              <Icon :icon="isDiffInline ? 'lucide:split' : 'lucide:split'" class="inline-block mr-2" />
            </template>
            <span>{{ isDiffInline ? '对比' : '内联' }}</span>
          </a-button>
        </a-tooltip>
      </div>
    </div>

    <!-- 编辑器容器 -->
    <div
      ref="diffEditorContainer"
      class="w-full"
      :style="{ height: editorHeight }"
    />
  </div>
</template>

<style lang="scss" scoped>
.monaco-diff-editor-container {
  @apply flex flex-col h-full;

  .toolbar {
    @apply bg-white dark:bg-neutral-900;

    .right-tools {
      .anticon {
        @apply text-lg;
      }
    }
  }
}

.next-btn {
  @apply rounded-md border dark:border-neutral-700;
  padding: 3px 8px;
  margin-left: 2px;
}

.next-btn:hover {
  @apply bg-neutral-200 dark:bg-neutral-700;
}

.next-btn-disable {
  @apply rounded-md border bg-neutral-100 dark:border-neutral-700;
  padding: 3px 8px;
  margin-left: 8px;
}

.next-btn-disable:hover {
  @apply bg-neutral-200 dark:bg-neutral-700;
}

.right-tools {
  :deep(.ant-btn) {
    padding: 0 6px;
  }
}
</style>
