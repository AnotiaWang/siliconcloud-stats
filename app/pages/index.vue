<script setup lang="ts">
  import type { DateRange } from '~/components/DateRangeSelector.vue'
  import type { DailyCostData } from '~~/types/logic'

  const dayjs = useDayjs()
  const cookieStore = useCookieStore()
  const toast = useToast()

  const loading = ref(false)
  const selectedDateRange = ref<DateRange>({
    start: dayjs().subtract(2, 'day').toDate(),
    end: new Date(),
  })
  const costDataCache = ref<DailyCostData>({})
  const costData = ref<DailyCostData>({})

  onMounted(() => {
    watch(
      selectedDateRange,
      () => {
        if (selectedDateRange.value) {
          fetchCostData()
        }
      },
      { immediate: true, flush: 'post' },
    )
  })

  async function fetchCostData(useCache = true) {
    if (!selectedDateRange.value) return
    loading.value = true

    try {
      const { start, end } = selectedDateRange.value
      const dates: string[] = []
      let current = dayjs(start)

      // 生成日期范围内的所有日期
      while (current.isSame(end, 'day') || current.isBefore(end, 'day')) {
        dates.push(current.format('YYYY-MM-DD'))
        current = current.add(1, 'day')
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
            color: 'red',
          })
          break // 遇到错误立即停止
        }
      }
    } catch (error) {
      console.error(error)
      toast.add({
        title: '获取数据失败',
        description: error instanceof Error ? error.message : '请检查网络连接',
        color: 'red',
      })
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <div class="container mx-auto p-4">
    <div class="flex items-center mb-4">
      <h1 class="text-2xl font-bold">SiliconCloud 使用量分析</h1>
      <CookieManager class="ml-auto" />
      <ColorModeButton class="ml-2" />
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium mb-2">选择日期范围：</label>
      <div class="flex gap-4">
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
    </div>
  </div>
</template>
