<script setup lang="ts">
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import MonacoJsonEditor from '~/components/MonacoJsonEditor.vue'
import { Editor, useSidebarStore } from '~/stores/sidebar'

const sidebarStore = useSidebarStore()

const jsonEditorRefs: Ref<{ [key: number]: typeof JsonEditor | null }> = ref({})

function updateEditorHand(editor: string) {
  sidebarStore.activeTab.editor = editor
}
</script>

<template>
  <template v-for="item in sidebarStore.menuItems" :key="item.id">
    <div v-show="item.id === sidebarStore.activeId">
      <Header :editor="item.editor" @update:editor="updateEditorHand" class="border-b" />
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
        Vanilla
      </div>
    </div>
  </template>
</template>

<style lang="scss">
</style>
