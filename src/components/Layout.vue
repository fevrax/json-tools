<script setup lang="ts" xmlns="http://www.w3.org/1999/html">
import {
  SettingOutlined
} from '@ant-design/icons-vue';
import {ref} from 'vue';

import {renderIcon} from "~/composables/icon";
import { useRouter } from 'vue-router'
import {useNavigation} from "~/composables/router";

// 在 setup 函数或 <script setup> 中
const router = useRouter()


const selectedKeys = ref<string[]>(['1']);
const collapsed = ref<boolean>(true)

onMounted(() => {
  // 设置 侧边栏宽度
  document.documentElement.style.setProperty('--sider-width', '58px');
})


const items = reactive([
    {
      key: 'textView',
      icon: renderIcon('icon-code'),
      label: '文本视图',
      title: '文本视图',
    },
    {
      key: 'setting',
      icon: () => h(SettingOutlined),
      label: '系统设置',
      title: '系统设置',
    }
  ]
)

const clickMenu = (e) => {
  useNavigation(router).navigateTo(e.key)
  console.log(e)
}


const headerStyle: CSSProperties = {
  width: '100%',
  height: '35px',
  lineHeight: '35px',
};


const siderCollapseFunc = (collapsed, type) => {
  if (collapsed == false) {
    document.documentElement.style.setProperty('--sider-width', '200px');
  } else {
    document.documentElement.style.setProperty('--sider-width', '58px');
  }
}

const footerStyle: CSSProperties = {
  height: '10px'
};
</script>

<template>
  <a-layout class="full-screen-div" >
    <a-layout-header :style="headerStyle" class="!bg-white !px-0">
      <Header></Header>
    </a-layout-header>
    <a-layout>
      <a-layout-sider class="sider" v-model:collapsed="collapsed"
                      @collapse="siderCollapseFunc"
                      collapsible
                      :theme="isDark ? 'dark' : 'light'">
        <a-menu v-model:selectedKeys="selectedKeys" :items="items" mode="inline" @click="clickMenu">
        </a-menu>
      </a-layout-sider>
      <a-layout-content>
        <slot/>
      </a-layout-content>
    </a-layout>
    <a-layout-footer :style="footerStyle">Footer</a-layout-footer>
  </a-layout>

</template>

<style lang="scss">
.full-screen-div {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.sider {
  min-width: var(--sider-width) !important;
  max-width: var(--sider-width) !important;
}

.ant-layout-sider-trigger {
  width: var(--sider-width) !important;
}

</style>
