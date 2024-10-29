<script setup lang="ts">
import { ref, watch } from 'vue'
import MonacoJsonEditor from '~/components/MonacoJsonEditor.vue'
import type { MenuItem } from '~/stores/sidebar'
import { Editor, useSidebarStore } from '~/stores/sidebar'

const sidebarStore = useSidebarStore()

const jsonEditorRefs: Ref<{ [key: number]: typeof JsonEditor | null }> = ref({})

function switchEditor(editor: string) {
  console.log('switchEditor editor ', editor, sidebarStore.activeTab)
  if (editor === Editor.Monaco) {
    sidebarStore.vanilla2JsonContent()
    sidebarStore.activeTab.editor = Editor.Monaco
  } else if (editor === Editor.Vanilla) {
    sidebarStore.jsonContent2VanillaContent()
    sidebarStore.activeTab.editor = Editor.Vanilla
    return undefined
  }
}

function jsonTextUpdate(jsonText: string) {
  console.log('jsonTextUpdate', jsonText)
  sidebarStore.updateCurrentTabContent(jsonText)
}
</script>

<template>
  <template v-for="item in sidebarStore.menuItems" :key="item.id">
    <div v-show="item.id === sidebarStore.activeId">
      <Header :editor="item.editor" class="border-b dark:border-b-neutral-800" @switch="switchEditor" />
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
          :mode="item.vanillaMode"
          @update:model-value="jsonTextUpdate"
        />
      </div>
    </div>
  </template>
</template>

<style lang="scss">
</style>
