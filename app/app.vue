<template>
  <div>
    <UApp :locale="zh_cn">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UApp>
  </div>
</template>

<script setup lang="ts">
  import { zh_cn } from '@nuxt/ui/locale'

  const colorMode = useColorMode()

  useHead({
    title: 'SiliconCloud Stats - SiliconCloud 平台使用情况分析工具',
    meta: [
      {
        name: 'description',
        content:
          'SiliconCloud Stats 是一个用于分析 SiliconCloud 平台使用情况的工具。通过输入 Cookie，可以拉取 SiliconCloud 控制台 API 来实现各种分析功能，如 token 用量分析等。',
      },
      { name: 'keywords', content: 'SiliconCloud, 数据分析, token 用量, API 分析, 控制台工具' },
      // Open Graph tags
      { property: 'og:title', content: 'SiliconCloud Stats - SiliconCloud 平台使用情况分析工具' },
      {
        property: 'og:description',
        content:
          'SiliconCloud Stats 是一个用于分析 SiliconCloud 平台使用情况的工具。通过输入 Cookie，可以拉取 SiliconCloud 控制台 API 来实现各种分析功能，如 token 用量分析等。',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: '/images/readme-showcase-total.webp' },
      // Twitter Card tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'SiliconCloud Stats - SiliconCloud 平台使用情况分析工具' },
      { name: 'twitter:description', content: 'SiliconCloud Stats 是一个用于分析 SiliconCloud 平台使用情况的工具。' },
      { name: 'twitter:image', content: '/images/readme-showcase-total.webp' },
    ],
    script: [
      {
        defer: true,
        src: 'https://umami.ataw.top/script.js',
        'data-website-id': '6be07672-962f-42fe-85fc-92e96a5f30d6',
      },
    ],
  })

  onMounted(() => {
    watchEffect(() => {
      if (colorMode.value === 'dark') {
        document.documentElement.setAttribute('theme-mode', 'dark')
      } else {
        document.documentElement.removeAttribute('theme-mode')
      }
    })
  })
</script>
