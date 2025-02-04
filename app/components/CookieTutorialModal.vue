<script setup lang="ts">
  const showModal = defineModel<boolean>({ default: false })
</script>

<template>
  <UModal v-model:open="showModal" class="!max-w-4xl" title="获取 Cookie 教程">
    <template #body>
      <ol class="list-decimal px-4">
        <li>
          登录
          <NuxtLink
            class="text-violet-500"
            to="https://cloud.siliconflow.cn"
            target="_blank"
          >
            cloud.siliconflow.cn
          </NuxtLink>
        </li>
        <li>
          在页面中点击右键，选择“检查”来打开开发者工具。（一些浏览器也支持按
          <UKbd value="F12" />
          打开）
        </li>
        <li>在开发者工具里，切换到“网络”（Network）标签页。</li>
        <li>
          在 SiliconCloud
          里，随便切换一个页面（比如“文本对话”页），可以看到开发者工具里多出了几个请求。
        </li>
        <li>点击最顶上的请求，找到“请求标头”，复制 Cookie 内容。</li>
      </ol>
      <img class="my-3" src="/images/cookie-tutorial.webp" mode="aspectFit" />
      <div class="text-orange-500">
        请注意保护好 Cookie。本项目不会保存您的 Cookie。
      </div>
    </template>
  </UModal>
</template>
