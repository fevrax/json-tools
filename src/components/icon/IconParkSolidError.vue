<script setup lang="ts">
const props = withDefaults(defineProps<Props>(), {
  size: '17',
})

defineComponent({
  name: 'IconParkSolidError',
})

interface Props {
  size?: string
}
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="props.size" :height="props.size" viewBox="0 0 48 48">
    <path fill="currentColor" fill-rule="evenodd" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="m6 11l5-5l13 13L37 6l5 5l-13 13l13 13l-5 5l-13-13l-13 13l-5-5l13-13z" clip-rule="evenodd" />
  </svg>
</template>
