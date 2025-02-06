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
