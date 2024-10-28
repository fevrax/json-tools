<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { message } from 'ant-design-vue'
import * as monaco from 'monaco-editor'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { isArrayOrObject, jsonParseError } from '~/utils/json'

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
        enabled: true, // 启用缩略图
      },
      colorDecorators: true, // 颜色装饰器
      readOnly: false, // 是否开启已读功能
      theme: props.theme || 'vs-light', // 主题
      fontSize: fontSize.value,
      mouseWheelZoom: true, // 启用鼠标滚轮缩放
      formatOnPaste: true, // 粘贴时自动格式化
      formatOnType: true, // 输入时自动格式化
      wordBasedSuggestions: true, // 启用基于单词的建议
      scrollBeyondLastLine: false, // 禁用滚动超出最后一行
      suggestOnTriggerCharacters: true, // 在触发字符时显示建议
      acceptSuggestionOnEnter: 'smart', // 按Enter键接受建议
      wordWrap: 'on', // 自动换行
    })

    // 监听内容变化
    editor.onDidChangeModelContent(async () => {
      emit('update:modelValue', editor!.getValue())
      // if (e.changes[0].rangeOffset < 2 && e.changes[0].text.length > 10) {
      //   await sleep(100)
      //   format()
      // }
    })

    // 添加粘贴事件监听
    editor.onDidPaste(async (e) => {
      if (editor.getValue() && e.range.startLineNumber < 2) {
        await sleep(100)
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

// 格式化并验证 菜单按钮点击
async function headerFormatHandle(callback: (success: boolean) => void) {
  callback(formatValidate())
}

// 验证内容 菜单按钮点击
async function headerValidateContentHandle(callback: (success: boolean) => void) {
  callback(validateContent())
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
  // 内容可能存在转义 需要解码
  const jsonStr = `"${editor.getValue()}"`
  try {
    // 第一次将解析结果为去除转移后字符串
    const unescapedJson = JSON.parse(jsonStr)
    // 去除转义后的字符串解析为对象
    const unescapedJsonObject = JSON.parse(unescapedJson)
    // 判断是否为对象或数组
    if (!isArrayOrObject(unescapedJsonObject)) {
      formatModelError.value = '不是有效的 Json 数据，无法进行解码操作'
      return
    }
    editor.setValue(unescapedJson)
    format()

    formatModelOpen.value = false
  } catch (error) {
    console.error(error)
    const jsonErr = jsonParseError(jsonStr)
    if (!jsonErr) {
      formatModelError.value = error.message
      return
    }
    console.error(jsonErr)
    if (jsonErr.line > 0) {
      formatModelError.value = `${jsonErr?.message} 第 ${jsonErr?.line} 行, 第 ${jsonErr?.column} 列，可能存在错误。 \n ${error.message}`
    } else {
      formatModelError.value = error.message
    }
  } finally {
    formatModelUnEscapeParseLoading.value = false
  }
}

// 一键定位错误行
async function formatModelByErrorLine() {
  if (parseJsonError.value.line <= 0) {
    message.error('一键定位失败')
    return
  }
  formatModelOpen.value = false
  highlightErrorLine(parseJsonError.value.line)
  message.success('一键定位成功')
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

// 计算错误的上下文行数
const contextLines = computed(() => {
  if (!parseJsonError.value.context)
    return 0
  return parseJsonError.value.context.split('\n').length
})

const errorStartLine = computed(() => {
  if (!parseJsonError.value.line)
    return 0
  return Math.max(1, parseJsonError.value.line - Math.floor(contextLines.value / 2))
})

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
  console.log('销毁编辑器')
  if (editor) {
    editor.dispose()
  }
})
// endregion
</script>

<template>
  <MonacoHeader class="border-b mb-2" @format="headerFormatHandle" @validate="headerValidateContentHandle" />
  <div ref="editorContainer" class="h-full w-full" />
  <a-modal
    v-model:open="formatModelOpen"
    :title="parseJsonError.message"
    :footer="null"
    width="60%"
    style="min-width: 450px; max-width: 800px"
    class="json-error-modal"
    @cancel="formatModelCancel"
  >
    <div class="modal-content">
      <div class="body">
        <div class="info-section">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item label="错误位置">
              第 <a-tag color="orange" class="ml-2">
                {{ parseJsonError.line }}
              </a-tag>行，
              第 <a-tag color="orange" class="ml-2">
                {{ parseJsonError.column }}
              </a-tag>列
            </a-descriptions-item>
            <a-descriptions-item label="异常信息">
              <a-typography-paragraph type="danger" copyable>
                {{ parseJsonError.error ? parseJsonError.error.message : '未知' }}
              </a-typography-paragraph>
            </a-descriptions-item>
          </a-descriptions>
        </div>
        <a-divider />
        <div class="context-section">
          <h3 class="context-title">
            错误上下文:
          </h3>
          <div class="context-wrapper">
            <div class="line-numbers">
              <span
                v-for="i in contextLines"
                :key="i"
                :class="{ 'error-line': errorStartLine + i - 1 === parseJsonError.line }"
              >
                {{ errorStartLine + i - 1 }}
              </span>
            </div>
            <pre class="context-content"><code>{{ parseJsonError.context }}</code></pre>
          </div>
        </div>
        <a-divider />
        <Transition name="fade">
          <div v-if="formatModelError">
            <p>尝试去除转义符解码失败：</p>
            <a-alert type="error" class="mt-4">
              <template #description>
                <pre>{{ formatModelError }}</pre>
              </template>
            </a-alert>
          </div>
        </Transition>
      </div>
      <div class="footer">
        <a-space>
          <a-button @click="formatModelCancel">
            取消
          </a-button>
          <a-button
            type="primary"
            :loading="formatModelUnEscapeParseLoading"
            @click="formatModelByUnEscapeJson"
          >
            <template #icon>
              <Icon icon="iconoir:remove-link" class="text-17 inline-block mr-1.5 relative" style="bottom: 1px" />
            </template>
            <span>去除转义符解码</span>
          </a-button>
          <!--    :disabled="parseJsonError.line === 0"      -->
          <a-button
            type="primary"
            @click="formatModelByErrorLine"
          >
            <template #icon>
              <Icon icon="ic:outline-my-location" class="text-17 inline-block mr-1.5 relative" style="bottom: 1px" />
            </template>
            <span>一键定位</span>
          </a-button>
        </a-space>
      </div>
    </div>
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

.error-message,
.error-context {
  white-space: pre-wrap; // 保留换行和空格，但允许文本换行
  word-wrap: break-word; // 允许长单词换行
}

.json-error-modal {
  .ant-modal-content {
    @apply rounded-lg shadow-lg overflow-hidden;
  }

  .modal-content {
    @apply flex flex-col h-full;

    .header {
      @apply mb-4;
    }

    .body {
      @apply flex-grow overflow-y-auto;

      .info-section {
        @apply mb-4;
      }

      .context-section {
        h3 {
          @apply text-lg font-semibold mb-2 dark:text-gray-200;
        }

        .error-context {
          @apply bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-x-auto whitespace-pre-wrap;
        }
      }
    }

    .footer {
      @apply mt-4 flex justify-end;
    }
  }

  .context-section {
    @apply mt-6;
    .context-title {
      @apply text-lg font-semibold mb-3 dark:text-gray-200;
    }
    .context-wrapper {
      @apply relative bg-gray-50 dark:bg-neutral-800 rounded-lg overflow-hidden flex;

      .line-numbers {
        @apply py-4 text-right text-gray-400 dark:text-gray-600 select-none bg-gray-100 dark:bg-neutral-900;
        min-width: 3em;
        span {
          @apply block text-sm font-mono px-2;
          line-height: 1.5;
          &.error-line {
            @apply bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 font-bold;
          }
        }
      }

      .context-content {
        @apply p-4 m-0 text-sm font-mono overflow-x-auto whitespace-pre flex-grow;
        line-height: 1.5;
      }
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition:
      opacity 0.5s ease,
      transform 0.5s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
  }

  .fade-enter-to,
  .fade-leave-from {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
