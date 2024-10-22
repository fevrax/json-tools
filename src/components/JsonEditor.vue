<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { onMounted, onUnmounted, ref, watch } from 'vue'

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
})

const fontSize = ref(props.fontSize || '14')
// 编辑器容器
const editorContainer = ref<HTMLElement | null>(null)

// 编辑器对象
let editor: monaco.editor.IStandaloneCodeEditor | null = null

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
    editor.onDidChangeModelContent((e) => {
      emit('update:modelValue', editor!.getValue())
      if (e.changes[0].rangeOffset === 0 && e.changes[0].text.length > 10) {
        // formatJson()
      }
    })

    // 添加粘贴事件监听
    editor.onDidPaste(() => {
      // if (firstPaste.value) {
      //   formatJson()
      // }
    })
  }
}

// 更新字体大小
function updateFontSize(size: number) {
  if (editor) {
    editor.updateOptions({ fontSize: size })
  }
}

// 格式化 JSON
function format() {
  editor.getAction('editor.action.formatDocument').run()
}

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
</script>

<template>
  <div ref="editorContainer" class="h-full w-full" />
</template>

<style>
/* 确保 monaco-editor 的样式被正确加载 */
</style>
