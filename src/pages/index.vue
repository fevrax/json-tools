<script setup lang="ts">
import { ref } from 'vue'
import MonacoJsonEditor from '~/components/MonacoJsonEditor.vue'
import { Editor, useSidebarStore } from '~/stores/sidebar'

const sidebarStore = useSidebarStore()

const monacoRefs: Ref<{ [key: number]: typeof JsonEditor | null }> = ref({})
const vanillaRefs: Ref = ref([])

function switchEditor(editor: string) {
  switch (editor) {
    case Editor.Monaco: {
      sidebarStore.vanilla2JsonContent()
      sidebarStore.activeTab.editor = Editor.Monaco
      return undefined
    }
    case Editor.MonacoDiff: {
      sidebarStore.activeTab.editor = Editor.MonacoDiff
      break
    }
    case Editor.Vanilla: {
      const ok = monacoRefs.value[`jsonEditor${sidebarStore.activeTab.id}`].validateContentAfterOpenDialog()
      if (!ok) {
        return undefined
      }
      sidebarStore.jsonContent2VanillaContent()
      vanillaRefs.value[`vanilla${sidebarStore.activeId}`].updateEditorContentAndMode()
      vanillaRefs.value[`vanilla${sidebarStore.activeId}`].updateEditorHeight()
      sidebarStore.activeTab.editor = Editor.Vanilla
      return undefined
    }
  }
}

function vanillaJsonEditorJsonUpdate(jsonText: string) {
  sidebarStore.updateCurrentTabContent(jsonText)
}

function monacoDiffEditorOriginUpdate(jsonText: string) {
  sidebarStore.activeTab.content = jsonText
}
</script>

<template>
  <template v-for="item in sidebarStore.menuItems" :key="item.id">
    <div v-show="item.id === sidebarStore.activeId">
      <Header :editor="item.editor" class="border-b dark:border-b-neutral-800 !py-1.5" @switch="switchEditor" />
      <div v-show="item.editor === Editor.Monaco" class="c-monaco">
        <div class="h-screen w-full">
          <MonacoJsonEditor
            :ref="(el) => { if (el) monacoRefs[`jsonEditor${item.id}`] = el }"
            v-model="item.content"
            language="json"
            :theme="isDark ? 'vs-dark' : 'vs-light'"
          />
        </div>
      </div>
      <div v-show="item.editor === Editor.MonacoDiff" class="c-monaco">
        <div class="h-screen w-full">
          <MonacoDiffEditor
            :ref="(el) => { if (el) monacoRefs[`jsonDiffEditor${item.id}`] = el }"
            :original-value="item.content"
            modified-value=""
            language="json"
            :theme="isDark ? 'vs-dark' : 'vs-light'"
            @update:original-value="monacoDiffEditorOriginUpdate"
          />
        </div>
      </div>
      <div v-show="item.editor === Editor.Vanilla" class="c-vanilla">
        <VanillaJsonEditor
          :ref="(el) => { if (el) vanillaRefs[`vanilla${item.id}`] = el }"
          :model-value="item.vanilla"
          :mode="item.vanillaMode"
          @update:model-value="vanillaJsonEditorJsonUpdate"
        />
      </div>
    </div>
  </template>
</template>

<style lang="scss">
</style>
