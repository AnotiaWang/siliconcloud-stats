<script setup lang="ts">
  import { today, getLocalTimeZone } from '@internationalized/date'
  import type { ShallowRef } from 'vue'
  import type CookieManager from '~/components/CookieManager.vue'
  import type ChartMonthlyUsage from '~/components/Chart/MonthlyUsage.vue'
  import type { DateRange } from '~/components/DateRangeSelector.vue'
  import type { DailyBillResults } from '~~/types/logic'

  const cookieStore = useCookieStore()
  const toast = useToast()

  const loading = ref(false)
  const selectedDateRange = shallowRef({
    start: today(getLocalTimeZone()).subtract({ days: 3 }),
    end: today(getLocalTimeZone()),
  }) as ShallowRef<DateRange>
  // API 返回的统计数据
  const costDataCache = ref<DailyBillResults>({})
  const costData = ref<DailyBillResults>({})

  const cookieManagerRef = ref<InstanceType<typeof CookieManager>>()
  const monthlyUsageRef = ref<InstanceType<typeof ChartMonthlyUsage>>()

  onNuxtReady(() => {
    watch(
      selectedDateRange,
      () => {
        // FIXME 目前会触发两次，原因未知
        if (selectedDateRange.value.start && selectedDateRange.value.end) {
          fetchCostData()
        }
      },
      { immediate: true },
    )
  })

  async function fetchCostData(useCache = true) {
    if (!selectedDateRange.value) return
    if (!cookieStore.cookie) {
      toast.add({
        title: '请设置 Cookie',
        color: 'error',
        duration: 3000,
      })
      cookieManagerRef.value?.openCookieModal()
      return
    }
    if (loading.value) return
    loading.value = true

    try {
      let start = selectedDateRange.value.start
      const end = selectedDateRange.value.end
      const dates: string[] = []

      // 生成日期范围内的所有日期
      while (start.compare(end) <= 0) {
        dates.push(start.toString())
        start = start.add({ days: 1 })
      }

      // 只有在不使用缓存时才清空数据
      if (!useCache) {
        costDataCache.value = {}
      }
      costData.value = {}

      // 如果有缓存，则直接使用
      for (const date of dates) {
        if (costDataCache.value[date]) {
          costData.value[date] = costDataCache.value[date]
        }
      }
      // 串行获取每一天的数据
      for (const date of dates) {
        // 如果该日期已有数据，则跳过
        if (costData.value[date]) {
          continue
        }

        try {
          const resp = await $fetch('/api/daily-bills', {
            method: 'POST',
            body: {
              cookie: cookieStore.cookie,
              date,
            },
            ignoreResponseError: true,
          })

          if (!Array.isArray(resp)) {
            // @ts-expect-error 如果忽略错误，resp 类型会变成 unknown
            throw new Error(`获取 ${date} 的数据失败: ${resp.message}`)
          }

          costData.value[date] = resp
          costDataCache.value[date] = resp
        } catch (error) {
          console.error(`获取 ${date} 的数据失败:`, error)
          toast.add({
            title: '获取数据失败',
            description:
              error instanceof Error ? error.message : '请检查网络连接',
            color: 'error',
            duration: 10_000,
          })
          break // 遇到错误立即停止
        }
      }
    } catch (error) {
      console.error(error)
      toast.add({
        title: '获取数据失败',
        description: error instanceof Error ? error.message : '请检查网络连接',
        color: 'error',
      })
    } finally {
      loading.value = false
    }
  }

  function onCookieUpdate() {
    fetchCostData()
    monthlyUsageRef.value?.fetchAllData()
  }
</script>

<template>
  <div class="container mx-auto p-4">
    <div class="flex flex-col sm:flex-row items-center mb-4 gap-2">
      <h1 class="text-2xl font-bold">SiliconCloud 使用量分析</h1>
      <div class="flex sm:items-center sm:ml-auto">
        <CookieManager
          ref="cookieManagerRef"
          class="ml-auto"
          @update="onCookieUpdate"
        />
        <ColorModeButton class="ml-2" />
      </div>
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium mb-2">选择日期范围：</label>
      <div class="flex gap-2">
        <DateRangeSelector v-model="selectedDateRange" />
        <UButton
          icon="i-heroicons-arrow-path-20-solid"
          :loading="loading"
          @click="fetchCostData(false)"
        >
          刷新
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4">
      <ChartDailyTotalUsage :data="costData" />
      <ChartModelUsageDistribution :data="costData" />
      <ChartMonthlyUsage ref="monthlyUsageRef" />
    </div>
  </div>
</template>
