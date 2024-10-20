<script setup lang="ts">

import {UserOutlined} from "@ant-design/icons-vue";
</script>

<template>
  <div>
    <div>textView</div>
    <a-space wrap>
      <a-button type="primary">Primary Button</a-button>
      <a-button>Default Button</a-button>
      <a-button type="dashed">Dashed Button</a-button>
      <a-button type="text">Text Button</a-button>
      <a-button type="link">Link Button</a-button>
    </a-space>
    <a-dropdown-button @click="handleButtonClick" class="inline-block p-0 m-0 w-5 h-5">
      Dropdown
      <template #overlay>
        <a-menu @click="handleMenuClick">
          <a-menu-item key="1">
            <UserOutlined />
            1st menu item
          </a-menu-item>
          <a-menu-item key="2">
            <UserOutlined />
            2nd menu item
          </a-menu-item>
          <a-menu-item key="3">
            <UserOutlined />
            3rd item
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown-button>
  </div>
</template>

<style scoped>

</style>
