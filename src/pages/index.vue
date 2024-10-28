<script setup lang="ts">
import { ref, watch } from 'vue'
import MonacoJsonEditor from '~/components/MonacoJsonEditor.vue'
import type { MenuItem } from '~/stores/sidebar'
import { Editor, useSidebarStore } from '~/stores/sidebar'

const sidebarStore = useSidebarStore()

const jsonEditorRefs: Ref<{ [key: number]: typeof JsonEditor | null }> = ref({})

function updateEditorHand(editor: string) {
  sidebarStore.activeTab.editor = editor
}

function jsonTextUpdate(jsonText: string) {
  console.log('jsonTextUpdate', jsonText)
  sidebarStore.updateCurrentTabContent(jsonText)
}

watch(() => sidebarStore.activeTab.editor, (newValue) => {
  console.log('watch editor change ', newValue, sidebarStore.activeTab)
  const activeItem = sidebarStore.activeTab
  if (newValue === Editor.Monaco) {
    if (!activeItem.vanilla) {
      return undefined
    }
    if (activeItem.vanilla && activeItem.vanilla.json) {
      activeItem.content = JSON.stringify(activeItem.vanilla.json, null, 2)
    }
    if (activeItem.vanilla && activeItem.vanilla.text) {
      activeItem.content = activeItem.vanilla.text
      console.log('Vanilla 存在更新文本')
    }
  } else if (newValue === Editor.Vanilla) {
    if (!activeItem.content) {
      activeItem.vanilla = { json: {} }
      return undefined
    }
    jsonEditorRefs.value[`jsonEditor${activeItem.id}`].validateContent()
    try {
      activeItem.vanilla = { json: JSON.parse(activeItem.content) }
      console.log('jsonTextUpdate 解析成功', activeItem.vanilla)
    } catch (e) {
      console.log('jsonTextUpdate 解析失败', e)
      activeItem.vanilla = { text: activeItem.content }
    }
  }
  // TODO 需要覆盖
})
</script>

<template>
  <template v-for="item in sidebarStore.menuItems" :key="item.id">
    <div v-show="item.id === sidebarStore.activeId">
      <Header :editor="item.editor" class="border-b dark:border-b-neutral-800" @update:editor="updateEditorHand" />
      <div v-show="item.editor === Editor.Monaco" class="c-monaco">
        <div class="h-screen w-full">
          <MonacoJsonEditor
            :ref="(el) => { if (el) jsonEditorRefs[`jsonEditor${item.id}`] = el }"
            v-model="item.content"
            language="json"
            :theme="isDark ? 'vs-dark' : 'vs-light'"
          />
        </div>
      </div>
      <div v-show="item.editor === Editor.Vanilla" class="c-vanilla">
        <VanillaJsonEditor
          :model-value="item.vanilla"
          @update:model-value="jsonTextUpdate"
        />
      </div>
    </div>
  </template>
</template>

<style lang="scss">
</style>
