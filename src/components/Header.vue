<script setup lang="ts">
import { CopyOutlined, DownOutlined } from '@ant-design/icons-vue'
</script>

<template>
  <a-flex justify="space-between" align="center">
    <a-flex>
      <div class="avatar px-3">
        <a-avatar src="https://minio.kl.do/picture/images/avatar-y.png" />
      </div>
      <div class="dropdown-text dark:!text-white">
        <a-dropdown-button type="link" placement="bottom" @click="handleButtonClick">
          复制
          <template #overlay>
            <a-menu @click="handleMenuClick">
              <a-menu-item key="compressedCopy">
                <CopyOutlined />
                压缩后复制
              </a-menu-item>
              <a-menu-item key="escapeCopy">
                <CopyOutlined />
                转义后复制
              </a-menu-item>
            </a-menu>
          </template>
          <template #icon>
            <div>
              <DownOutlined />
            </div>
          </template>
        </a-dropdown-button>
      </div>
    </a-flex>
    <a-flex class="mr-4">
      <theme-toggle />
    </a-flex>
  </a-flex>
</template>

<style lang="scss">
.dropdown-text {
  .ant-btn-link {
    padding-right: 0;
    padding-left: 0;
    width: 40px;
    color: #333;
    border-radius: 6px;
    transition:
      color 0.3s ease,
      background-color 0.3s ease,
      box-shadow 0.3s ease;

    // 夜间模式
    @apply dark:text-white;
  }

  .ant-btn-link:hover {
    color: #000;
    background-color: rgb(232, 232, 232);
    border-radius: 6px;
    // 夜间模式
    @apply dark:text-white;
    @apply dark:!bg-zinc-800;
  }

  .ant-dropdown-trigger {
    width: 25px;
  }
}
</style>
