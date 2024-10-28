<script setup lang="ts">
import type { Content, JsonEditor, JSONEditorPropsOptional, MenuItem } from 'vanilla-jsoneditor-cn'
import { message } from 'ant-design-vue'
import { createJSONEditor } from 'vanilla-jsoneditor-cn'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSidebarStore } from '~/stores/sidebar'
// import { parse, stringify } from 'lossless-json'
import type { MenuItem as SidebarMenuItem } from '~/stores/sidebar'

interface Props {
  modelValue: Content
  options?: JSONEditorPropsOptional
  minHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  minHeight: '200px',
})

const sidebarStore = useSidebarStore()

const editorContainer = ref<HTMLElement | null>(null)
let editor: JsonEditor | null = null

const separatorItem = { type: 'separator' } // 分隔符
const addButtonItem = {
  type: 'button',
  text: '新增',
  icon: { iconName: '', prefix: '', icon: [24, 24, [], '', 'M11 20a1 1 0 1 0 2 0v-7h7a1 1 0 1 0 0-2h-7V4a1 1 0 1 0-2 0v7H4a1 1 0 1 0 0 2h7z'] },
  onClick: () => {
    sidebarStore.addTab()
  },
  title: '新增一个标签页',
  className: 'jse-group-text-button',
}
const copyButtonItem = {
  type: 'button',
  text: '复制',
  icon: { iconName: '', prefix: '', icon: [24, 24, [], '', 'M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zm-4 6q-.825 0-1.412-.587T3 20V6h2v14h11v2zm4-6V4z'] },
  onClick: () => {
    const content = editor.get()
    if (!content) {
      message.error('复制失败')
      return undefined
    }
    if (content.json) {
      const text = JSON.stringify(content.json, null, 2)
      navigator.clipboard.writeText(text).then(() => {
        message.success('复制成功')
      })
    }
  },
  title: '复制当前全部内容',
  className: 'jse-group-text-button',
}
const clearButtonItem = {
  type: 'button',
  text: '清空',
  icon: { iconName: '', prefix: '', icon: [24, 24, [], '', 'M15 2H9c-1.103 0-2 .897-2 2v2H3v2h2v12c0 1.103.897 2 2 2h10c1.103 0 2-.897 2-2V8h2V6h-4V4c0-1.103-.897-2-2-2M9 4h6v2H9zm8 16H7V8h10z'] },
  onClick: () => {
    editor?.set({ json: {}, text: '' })
  },
  title: '清空当前内容',
  className: 'jse-group-text-button',
}

// 编辑器参数
const options: JSONEditorPropsOptional = {
  mode: 'tree',
  // parser
  content: { json: props.modelValue ? props.modelValue : {} },
  target: editorContainer.value,
  onChange: (content: Content, previousContent: Content, changeStatus: { contentErrors: ContentErrors | undefined, patchResult: JSONPatchResult | undefined }) => {
    console.log('onChange', 'content', content, 'previousContent', previousContent, 'changeStatus', changeStatus)
    // let jsonText = ''
    // if (content.json !== undefined) {
    //   console.log('当前 tree 模式更新数据', 'content.json', content.json)
    //   jsonText = JSON.stringify(content.json, null, 2)
    // } else if (content.text !== undefined) {
    //   console.log('当前 text 模式更新数据', 'content.text', content.text)
    //   jsonText = content.text
    // }
    // emit('update:modelValue', jsonText)
    sidebarStore.activeTab.vanilla = content
  },
  onRenderMenu: (menu: MenuItem[], context) => {
    // console.log('menu', menu, context)
    menu.splice(2, 1); // 删除表格模式
    [menu[0], menu[1]] = [menu[1], menu[0]] // 第一个为树形模式，第二个为文本模式
    menu.splice(2, 0, separatorItem)
    menu.splice(3, 0, addButtonItem)
    menu.splice(4, 0, copyButtonItem)
    menu.splice(5, 0, clearButtonItem)

    for (let i = 0; i < menu.length; i++) {
      if (menu[i].title?.includes('格式化JSON')) {
        menu[i].text = '格式化'
        menu[i].className += ' jse-group-text-button'
        menu[i].icon = { iconName: '', prefix: '', icon: [24, 24, [], '', 'm15.092 8.02l-2.829-2.828L16.506.95a1 1 0 0 1 1.414 0l1.415 1.414a1 1 0 0 1 0 1.414l-4.243 4.243zm-1.414 1.415l-9.9 9.9a1 1 0 0 1-1.414 0L.95 17.92a1 1 0 0 1 0-1.414l9.9-9.9zM8.728.243l1.393.704l1.435-.704l-.679 1.46l.68 1.368l-1.384-.664l-1.445.664l.689-1.42zm9.9 7.07l1.393.705l1.435-.704l-.68 1.46l.68 1.368l-1.384-.664l-1.445.664l.69-1.42l-.69-1.408z'] }
      }
      if (menu[i].title?.includes('压缩JSON')) {
        menu[i].text = '压缩'
        menu[i].className += ' jse-group-text-button'
        menu[i].icon = { iconName: '', prefix: '', icon: [56, 56, [], '', 'M27.91 17.98c.476 0 .837-.18 1.312-.61l7.532-7.011c.384-.34.588-.747.588-1.267c0-.927-.701-1.606-1.651-1.606c-.452 0-.882.204-1.244.543l-2.94 2.94l-1.945 2.036l.158-3.8V1.742C29.72.792 28.883 0 27.91 0c-.972 0-1.786.792-1.786 1.742v7.463l.136 3.8l-1.946-2.036l-2.94-2.94c-.339-.34-.791-.543-1.244-.543c-.972 0-1.65.679-1.65 1.606c0 .52.203.927.61 1.267l7.509 7.011c.475.43.86.61 1.312.61M8.868 35.193h38.087c3.777 0 6.4-2.556 6.4-6.038v-2.308c0-3.483-2.623-6.038-6.4-6.038H8.867c-3.754 0-6.4 2.555-6.4 6.038v2.308c0 3.482 2.646 6.038 6.4 6.038m.475-3.415c-2.036 0-3.28-1.357-3.28-3.189v-1.176c0-1.832 1.244-3.19 3.28-3.19h37.137c2.036 0 3.28 1.358 3.28 3.19v1.176c0 1.832-1.244 3.19-3.28 3.19ZM27.911 56c.972 0 1.809-.792 1.809-1.742v-7.463l-.158-3.8l1.945 2.036l2.94 2.94c.362.34.792.543 1.244.543c.95 0 1.651-.656 1.651-1.606c0-.52-.204-.905-.588-1.267l-7.532-7.011c-.475-.43-.836-.588-1.311-.588c-.453 0-.837.158-1.312.588l-7.51 7.011c-.406.362-.61.747-.61 1.267c0 .95.679 1.606 1.651 1.606c.453 0 .905-.204 1.244-.543l2.94-2.94l1.946-2.036l-.136 3.8v7.463c0 .95.814 1.742 1.787 1.742'] }
      }
      if (menu[i].title?.includes('转换内容')) {
        menu[i].icon = { iconName: '', prefix: '', icon: [24, 24, [], '', 'M7.707 2.293a1 1 0 0 1 0 1.414L5.414 6H21a1 1 0 1 1 0 2H5.414l2.293 2.293a1 1 0 1 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 0 1 1.414 0m8.586 10a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414-1.414L18.586 18H3a1 1 0 1 1 0-2h15.586l-2.293-2.293a1 1 0 0 1 0-1.414'] }
      }
    }
    return menu
  },
  onError(err: Error) {
    console.error('Error in JSONEditor:', err)
  },
}

function initEditor() {
  if (editorContainer.value) {
    editor = createJSONEditor({
      target: editorContainer.value,
      props: options,
    })
  }
}

function updateEditorHeight() {
  if (editorContainer.value) {
    const windowHeight = window.innerHeight
    const containerRect = editorContainer.value.getBoundingClientRect()
    const newHeight = Math.max(Number.parseInt(props.minHeight), windowHeight - containerRect.top - 20 - 30)
    editorContainer.value.style.height = `${newHeight}px`
    editor?.refresh()
  }
}

onMounted(() => {
  nextTick(() => {
    initEditor()
    updateEditorHeight()
    window.addEventListener('resize', updateEditorHeight)
    if (editor) {
      // 更新文本
      console.log('onMounted modelValue 更新', props.modelValue)
      // 如果值都为空
      if (!props.modelValue || !props.modelValue.json || !props.modelValue.text) {
        console.log('vanilla 接收的值为空，设置 {}')
        editor.set({ json: {} })
        return
      }
      if (props.modelValue.json) {
        editor.set({ json: props.modelValue })
        console.log('vanilla 接收的值为 json')
        return
      }
      if (props.modelValue.text) {
        console.log('vanilla 接收的值为 text, 解析为 json 对象')
        let jsonObject = {}
        try {
          jsonObject = JSON.parse(props.modelValue)
          console.log('vanilla 解析为 json 对象', json)
        } catch (error) {
          console.error('vanilla 解析为 json 对象失败', error)
        }
        editor.set({ json: jsonObject })
      }
    }
  })
})

onBeforeUnmount(() => {
  if (editor) {
    editor.destroy()
  }
})

watch(() => sidebarStore.activeTab.vanilla, (newValue) => {
  if (editor) {
    editor.set(sidebarStore.activeTab.vanilla)
  }
}, { deep: true })
</script>

<template>
  <div ref="editorContainer" class="json-editor" :class="{ 'jse-theme-dark': isDark }" />
</template>

<style lang="scss">
@use 'vanilla-jsoneditor-cn/themes/jse-theme-dark.css';
:root {
  // key 颜色
  --jse-key-color: #92278f;
}

.json-editor {
  flex: 1;
  min-height: v-bind('props.minHeight');
  @apply dark:bg-zinc-900 !important;

  .jse-contents {
    @apply border-0 !important;
  }

  // 菜单栏
  .jse-menu {
    background: none !important;
    padding: 2px 16px 2px 16px !important;
    @apply text-black dark:text-white !important;
    position: absolute;
    border-bottom: 1px solid #e8e8e8;
    @apply dark:border-zinc-800;

    .jse-separator {
      @apply bg-gray-600 !important;
    }

    .jse-button:disabled {
      @apply text-gray-400 !important;
    }

    .jse-selected {
      @apply text-blue-700 dark:text-blue-500 font-bold !important;
    }

    .jse-group-button {
      margin: 2px 2px 0 2px !important;
    }

    // 所有操作按钮包含模式切换按钮
    .jse-button {
      @apply rounded-lg duration-300 border-none dark:bg-neutral-900 !important;
      padding: 14px 6px !important;
      background-color: transparent !important;
    }
    .jse-button:hover,
    .jse-button:active {
      @apply bg-gray-200 dark:bg-vscode-dark text-blue-600 !important;
      outline: none !important;
      box-shadow: none !important;
    }

    .jse-button:focus {
      transition:
        background-color 1s,
        color 2s !important;
    }

    // 模式切换按钮
    .jse-group-button {
      height: 32px !important;
      margin-top: 0 !important;
      padding: 14px 2px !important;
      @apply rounded-lg duration-300 border-none dark:bg-neutral-900 !important;
      @apply hover:bg-white dark:hover:bg-neutral-900 hover:text-blue-600 !important;
    }

    // 自定义文本按钮
    .jse-group-text-button {
      @apply mt-0 !important;
      width: auto !important;
      height: calc(var(--jse-menu-button-size, 32px) - var(--jse-padding, 10px));
    }
  }
}
</style>
