<template>
  <UContainer class="flex flex-col items-center px-4 py-10 gap-y-8 h-full">
    <h1 class="text-[26px]">Nuxt & Nuxt UI</h1>
    <div class="space-x-2">
      <UButton
        @click="
          $colorMode.preference =
            $colorMode.preference === 'light' ? 'dark' : 'light'
        "
      >
        <template #leading>
          <UIcon
            :name="
              $colorMode.preference === 'light'
                ? 'i-heroicons-sun'
                : 'i-heroicons-moon'
            "
          />
        </template>
        当前主题：{{ $colorMode.preference === 'light' ? 'Light' : 'Dark' }}
      </UButton>
    </div>
    <div class="grid grid-cols-2 sm:flex flex-row items-center gap-2">
      <UButton>按钮示例</UButton>
      <UButton :loading="true" color="orange">按钮示例</UButton>
      <UButton :disabled="true" color="red">按钮示例</UButton>
      <UButton variant="outline" color="green">按钮示例</UButton>
    </div>

    <div class="flex flex-col sm:flex-row items-center gap-4">
      <UToggle v-model="isLoading" size="lg">
        <template #label>加载中</template>
      </UToggle>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
  const isLoading = ref(true)
  const alertTheme = ref<'success' | 'warning' | 'error' | 'info'>('success')

  onMounted(() => {
    setInterval(() => {
      isLoading.value = !isLoading.value
      if (alertTheme.value === 'success') {
        alertTheme.value = 'warning'
      } else if (alertTheme.value === 'warning') {
        alertTheme.value = 'error'
      } else if (alertTheme.value === 'error') {
        alertTheme.value = 'info'
      } else {
        alertTheme.value = 'success'
      }
    }, 2000)
  })
</script>
