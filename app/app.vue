<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>

  <UNotifications />
</template>

<script setup lang="ts">
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
