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
