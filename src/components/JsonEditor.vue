<script setup lang="ts">
import { message } from 'ant-design-vue'
import * as monaco from 'monaco-editor'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { sleep } from '~/utils/sleep'

const props = defineProps<{
  modelValue: string
  language: string
  theme: string // vs-light|vs-dark
  fontSize?: number // 字体大小
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

defineExpose({
  format,
  formatValidate,
  validateContent,
})

const formatModelOpen = ref(false)
const formatModelUnEscapeParseLoading = ref(false)
const parseJsonError = ref<JsonErrorInfo>({})

const formatModelError = ref('') // 二次转换后失败

// 编辑器默认字体大小
const fontSize = ref(props.fontSize || '14')
// 编辑器容器
const editorContainer = ref<HTMLElement | null>(null)

// 编辑器对象
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let errorDecorations: monaco.editor.IEditorDecorationsCollection | null = null

// 创建编辑器实例
function createEditor() {
  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: props.modelValue || '',
      language: props.language || 'json',
      minimap: {
        enabled: true,
      },
      colorDecorators: true, // 颜色装饰器
      readOnly: false, // 是否开启已读功能
      theme: props.theme || 'vs-light', // 主题
      fontSize: fontSize.value,
      mouseWheelZoom: true, // 启用鼠标滚轮缩放
      formatOnPaste: true, // 粘贴时自动格式化
      formatOnType: true, // 输入时自动格式化
      wordBasedSuggestions: true,
      suggestOnTriggerCharacters: true, // 在触发字符时显示建议
      acceptSuggestionOnEnter: 'smart', // 按Enter键接受建议
      wordWrap: 'on', // 自动换行
    })

    // 监听内容变化
    editor.onDidChangeModelContent(async (e) => {
      emit('update:modelValue', editor!.getValue())
      // if (e.changes[0].rangeOffset < 2 && e.changes[0].text.length > 10) {
      //   await sleep(100)
      //   format()
      // }
    })

    // 添加粘贴事件监听
    editor.onDidPaste(async (e) => {
      if (editor.getValue() && e.range.startLineNumber < 2) {
        formatValidate()
      }
    })

    // 添加窗口大小变化的监听
    window.addEventListener('resize', handleResize)
  }
}

// 更新字体大小
function updateFontSize(size: number) {
  if (editor) {
    editor.updateOptions({ fontSize: size })
  }
}

// 格式化 JSON
function format(): boolean {
  if (editor?.getValue() === '') {
    message.warn('暂无内容')
    return false
  }
  editor.getAction('editor.action.formatDocument').run()
  return true
}

// 验证格式并格式化
function formatValidate(): boolean {
  const jsonErr = jsonParseError(editor.getValue())
  if (jsonErr) {
    parseJsonError.value = jsonErr
    formatModelOpen.value = true
    return false
  }
  return format()
}

// 验证 JSON, 不进行格式化
function validateContent(): boolean {
  if (editor?.getValue() === '') {
    message.warn('暂无内容')
    return false
  }
  const jsonErr = jsonParseError(editor.getValue())
  if (jsonErr) {
    parseJsonError.value = jsonErr
    formatModelOpen.value = true
    return false
  }
  return true
}

// 监听窗口大小变化
function handleResize() {
  if (editor) {
    // 更新布局
    editor.layout()
  }
}

function formatModelCancel() {
  formatModelOpen.value = false
  formatModelError.value = ''
  parseJsonError.value = ''
}

// 解码 JSON 处理转义
async function formatModelByUnEscapeJson() {
  formatModelUnEscapeParseLoading.value = true
  try {
    // 内容可能存在转义 需要解码
    const jsonStr = `"${editor.getValue()}"`
    const unescapedJson = JSON.parse(jsonStr)
    editor.setValue(unescapedJson)
    format()

    formatModelOpen.value = false
  }
  catch (error) {
    formatModelError.value = error.message
  }
  finally {
    formatModelUnEscapeParseLoading.value = false
  }
}

// 一键定位错误行
async function formatModelByErrorLine() {
  if (parseJsonError.value.line <= 0) {
    message.error('定位错误行失败')
    return
  }
  formatModelOpen.value = false
  highlightErrorLine(parseJsonError.value.line)
  message.success('定位错成功')
}

// 高亮错误行
function highlightErrorLine(lineNumber: number) {
  if (editor) {
    // 滚动到错误行
    editor.revealLineInCenter(lineNumber)
    // 如果存在旧的装饰，先清除
    if (errorDecorations) {
      errorDecorations.clear()
    }

    // 创建新的装饰集合
    errorDecorations = editor.createDecorationsCollection([
      {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: 'errorLineHighlight',
          glyphMarginClassName: 'errorGlyphMargin',
        },
      },
    ])

    // 5秒后移除高亮
    setTimeout(() => {
      if (errorDecorations) {
        errorDecorations.clear()
      }
    }, 5000)
  }
}

// region 监听属性变化
// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue)
  }
})

// 监听主题变化
watch(() => props.theme, (newValue) => {
  editor.updateOptions({
    theme: newValue,
  })
})

watch(() => props.fontSize, (newValue) => {
  updateFontSize(newValue)
})

onMounted(() => {
  createEditor()
})

onUnmounted(() => {
  if (editor) {
    editor.dispose()
  }
})
// endregion
</script>

<template>
  <div ref="editorContainer" class="h-full w-full" />
  <a-modal v-model:open="formatModelOpen" :title="parseJsonError.message" width="60%" style="max-width: 800px">
    <div class="modal-content">
      <p>错误行：第 <span class="text-amber-600">{{ parseJsonError.line }}</span> 行，第 <span class="text-amber-600">{{parseJsonError.column}}</span> 列，可能存在格式错误，请检查。</p>
      <br>
      <p>异常信息：<pre class="error-message">{{ parseJsonError.error ? parseJsonError.error.message : '未知' }}</pre></p>
      <br>
      <p>错误上下文：</p>
      <p class="text-red-600 whitespace-pre error-context">{{ parseJsonError.context }}</p>
      <br>
      <p v-if="formatModelError !== ''"> 转换失败：{{ formatModelError }}</p>
    </div>
    <template #footer>
      <a-button key="back" @click="formatModelCancel">
        取消
      </a-button>
      <a-button key="submit" type="primary" :loading="formatModelUnEscapeParseLoading" @click="formatModelByUnEscapeJson">
        解析转义JSON
      </a-button>
      <a-button key="submit" :disabled="parseJsonError.line === 0" type="primary" :loading="formatModelUnEscapeParseLoading" @click="formatModelByErrorLine">
        一键定位
      </a-button>
    </template>
  </a-modal>
</template>

<style lang="scss">
.errorLineHighlight {
  @apply bg-red-200 dark:bg-red-700;
  margin-left: 3px;
  width: 100%;
}
.errorGlyphMargin {
  background-color: #ff0000;
}

.modal-content {
  max-height: 60vh; // 设置最大高度为视窗高度的60%
  overflow-y: auto; // 添加垂直滚动条
  word-break: break-all; // 确保长文本换行
  padding-right: 16px; // 为滚动条留出空间
}
.error-message, .error-context {
  white-space: pre-wrap; // 保留换行和空格，但允许文本换行
  word-wrap: break-word; // 允许长单词换行
}
</style>
