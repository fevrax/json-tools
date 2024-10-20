<script setup lang="ts">
interface MenuItem {
  key: string
  name: string
  icon: any
}

interface Props {
  icon: any
  name: string
  items?: MenuItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'click', key?: string): void
}>()

const showDropdown = ref(false)

const handleSelect = (key: string) => {
  emit('click', key)
  showDropdown.value = false
}

const handleMainClick = () => {
  if (!props.items) {
    emit('click')
  } else {
    showDropdown.value = !showDropdown.value
  }
}

// 打印 items 内容
const printItems = () => {
  console.log('props:', props)
  if (props.items) {
    console.log('Items:', JSON.stringify(props.items, null, 2))
  } else {
    console.log('No items provided')
  }
}

// 在组件挂载时打印 items
onMounted(() => {
  printItems()
})

// 监听 items 的变化并打印
watch(() => props.items, (newItems) => {
  console.log('Items updated:')
  printItems()
}, { deep: true })

</script>

<template>

</template>

<style scoped>

</style>
