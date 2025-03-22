<script setup lang="ts">
  import type CookieManager from '~/components/CookieManager.vue'
  import type ChartMonthlyUsage from '~/components/Chart/MonthlyUsage.vue'
  import type ChartDailyUsage from '~/components/Chart/DailyUsage.vue'

  const cookieStore = useCookieStore()
  const toast = useToast()

  const cookieManagerRef = ref<InstanceType<typeof CookieManager>>()
  const monthlyUsageRef = ref<InstanceType<typeof ChartMonthlyUsage>>()
  const dailyUsageRef = ref<InstanceType<typeof ChartDailyUsage>>()

  function onCookieUpdate() {
    monthlyUsageRef.value?.refetch()
    dailyUsageRef.value?.refetch()
  }

  onNuxtReady(() => {
    if (!cookieStore.cookie) {
      // 如果 cookie 不存在，打开 Cookie 设置弹窗
      toast.add({
        title: '请设置 Cookie',
        color: 'error',
        duration: 3000,
      })
      cookieManagerRef.value?.openCookieModal()
    }
  })
</script>

<template>
  <div class="container mx-auto p-4">
    <div class="flex flex-col sm:flex-row items-center mb-4 gap-2">
      <h1 class="text-2xl font-bold">SiliconCloud 使用量分析</h1>
      <div class="flex sm:items-center sm:ml-auto">
        <UButton
          color="primary"
          variant="subtle"
          icon="i-lucide-github"
          to="https://github.com/AnotiaWang/deep-research-web-ui"
          target="_blank"
        >
        </UButton>
        <CookieManager ref="cookieManagerRef" class="ml-2" @update="onCookieUpdate" />
        <ColorModeButton class="ml-2" />
      </div>
    </div>

    <ChartDailyUsage ref="dailyUsageRef" />
    <ChartMonthlyUsage ref="monthlyUsageRef" class="mt-4" />
  </div>
</template>
