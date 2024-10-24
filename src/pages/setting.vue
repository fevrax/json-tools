<script setup lang="ts" generic="T extends any, O extends any">
import { Icon } from '@iconify/vue';
import IconParkSolidError from "~/components/icon/IconParkSolidError.vue";

defineOptions({
  name: 'SettingPage',
})

// const name = ref('')
//
// const router = useRouter()
// function go() {
//   if (name.value)
//     router.push(`/hi/${encodeURIComponent(name.value)}`)
// }
</script>

<template>
  <div class="text-black">
    设置
    <Icon icon="solar:code-bold" class="text-2xl"/>
    <Iconify icon="solar:code-bold" class="text-2xl" />
    <IconParkSolidError></IconParkSolidError>
  </div>
</template>
