<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

interface Props {
  data: object | array
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({}),
})

// const emit = defineEmits<{
//   (e: 'click', path: string[], data: any): void
//   (e: 'change', data: object | array): void
// }>()

const jsonPrettyRef = ref()
const containerRef = ref<HTMLElement | null>(null)
const treeHeight = ref(0)

const state = reactive({
  renderOK: true,
  selectedValue: '',
  rootPath: 'res',
  node: '',
})

const parsedData = computed(() => {
  try {
    return typeof props.data === 'string' ? JSON.parse(props.data) : props.data
  }
  catch (e) {
    console.error('Invalid JSON data:', e)
    return null
  }
})

// 节点点击事件
function handleNodeClick(node) {
  console.log('handleNodeClick', node)
  state.node = node
}

// 更新高度
function updateHeight() {
  if (containerRef.value) {
    treeHeight.value = containerRef.value.clientHeight - 32 - 35 - 15 - 45
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    updateHeight()
    resizeObserver = new ResizeObserver(updateHeight)
    if (containerRef.value) {
      resizeObserver.observe(containerRef.value)
    }
  })
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<template>
  <div ref="containerRef" class="json-tree-viewer-container">
    <div class="json-tree-viewer">
      <VueJsonPretty
        ref="jsonPrettyRef"
        v-model:selected-value="state.selectedValue"
        :data="parsedData"
        :theme="isDark ? 'dark' : 'light'"
        :item-height="26"
        :deep="5"
        :show-icon="true"
        :show-length="true"
        :show-line="false"
        :show-line-number="true"
        :collapsed="true"
        selectable-type="single"
        :highlight-selected-node="false"
        :virtual="true"
        :height="treeHeight"
        :editable="true"
        editable-trigge="dblclick"
        @node-click="handleNodeClick"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.json-tree-viewer-container {
  @apply h-full w-full;

  .json-tree-viewer {
    @apply flex-grow overflow-auto pt-1;
    width: 100%;

    :deep(.vjs-tree) {
      @apply font-mono text-sm;
      width: 100%;
    }

    :deep(.vjs-tree-node) {
      width: 100%;
    }

    // key 样式
    :deep(.vjs-key) {
      @apply text-fuchsia-800 dark:text-blue-400;
    }

    // value 样式
    :deep(.vjs-value) {
      @apply text-green-600 dark:text-green-400;
    }

    // input 输入框
    :deep(.vjs-value input) {
      @apply bg-transparent border-0 border-b-2 border-gray-300 focus:border-blue-500 dark:border-gray-600 dark:focus:border-blue-400;
      @apply outline-none transition-colors duration-200 ease-in-out rounded-md p-0 m-0;
      @apply text-sm text-gray-700 dark:text-gray-300;
    }

    :deep(.vjs-virtual-scroll) {
      width: 100% !important;
    }
  }
}
</style>
