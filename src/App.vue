<script setup lang="ts">
import { theme } from 'ant-design-vue';
import {isDark} from "~/composables";

</script>

<template>
  <main font-sans>
    <a-config-provider
      :locale="locale"
      :theme="{
      algorithm: isDark ? theme.darkAlgorithm : null,
    }">
      <layout>
        <RouterView/>
      </layout>
    </a-config-provider>
  </main>
</template>
