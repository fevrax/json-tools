<script setup lang="ts" generic="T extends any, O extends any">
import { VueDraggable } from 'vue-draggable-plus'
defineOptions({
  name: 'SettingPage',
})

const list = ref([
  {id: 1, name: "feng1", goods: [1,2,3]},
  {id: 2, name: "feng2"},
  {id: 3, name: "feng3", goods: [4,5]},
  {id: 4, name: "feng4"}
])
const ob = ref({
  id: 1, name: "feng1", goods: [1,2,3]
})

</script>

<template>
  <div class="text-black">
    正在努力开发中...
  </div>
</template>
