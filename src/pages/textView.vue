<script setup lang="ts">
const value = ref(1)
const panels = ref([1, 2, 3, 4, 5, 7,8,9,10,11])
const addable = computed(() => {
  return {
    disabled: panels.value.length >= 20
  }
})
const closable = computed(() => {
  return panels.value.length > 1
})

function handleAdd() {
  const newValue = Math.max(...panels.value) + 1
  panels.value.push(newValue)
  value.value = newValue
}

function handleClose(name: number) {
  const { value: panels } = panels
  const nameIndex = panels.findIndex(panelName => panelName === name)
  if (!~nameIndex)
    return
  panels.splice(nameIndex, 1)
  if (name === value.value) {
    value.value = panels[Math.min(nameIndex, panels.length - 1)]
  }
}
</script>

<template>
  <div>
    <n-tabs
      v-model:value="value"
      type="card"
      :addable="addable"
      :closable="closable"
      tab-style="min-width: 80px;"
      @close="handleClose"
      @add="handleAdd"
      class="overflow-auto"
    >
      <n-tab-pane v-for="panel in panels" :key="panel" :name="panel">
        {{ panel }}
      </n-tab-pane>
<!--      <template #prefix>-->
<!--        Prefix-->
<!--      </template>-->
<!--      <template #suffix>-->
<!--        Suffix-->
<!--      </template>-->
    </n-tabs>
  </div>
</template>

<style scoped>

</style>
