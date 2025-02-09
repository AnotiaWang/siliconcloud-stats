<script setup lang="ts">
  import { today, getLocalTimeZone } from '@internationalized/date'
  import type { DailyBillResults, LLMType } from '~~/types/logic'
  import type { EChartsOption } from 'echarts'
  import type { VChart } from '#components'
  import type { ShallowRef } from 'vue'
  import type { DateRange } from '~/components/DateRangeSelector.vue'

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

  const chartRef = ref<InstanceType<typeof VChart>>()
  const { isNarrowScreen } = useChartAutoResize(chartRef)
  const { getBaseChartOption, getLegendOption, getAxisOption, formatTooltip } = useChart()

  // 是否显示模型使用量
  const showModelUsage = ref(false)

  onNuxtReady(() => {
    watch(
      selectedDateRange,
      () => {
        if (selectedDateRange.value.start && selectedDateRange.value.end) {
          console.log('watch selectedDateRange')
          fetchCostData()
        }
      },
      { immediate: true, deep: false },
    )
  })

  async function fetchCostData(useCache = true) {
    if (!selectedDateRange.value) return
    if (!cookieStore.cookie) {
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
            description: error instanceof Error ? error.message : '请检查网络连接',
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

  // 合并后的图表配置
  const chartOption = computed<EChartsOption>(() => {
    if (!costData.value) return {}

    const dates = Object.keys(costData.value).sort()

    if (showModelUsage.value) {
      // 模型使用量视图
      const modelSet = new Set<string>()
      Object.values(costData.value).forEach((dayData) => {
        dayData.forEach((item) => {
          item.models.forEach((model) => {
            modelSet.add(model.name)
          })
        })
      })
      const models = Array.from(modelSet)

      return {
        ...getBaseChartOption(isNarrowScreen.value),
        tooltip: {
          ...getBaseChartOption(isNarrowScreen.value).tooltip,
          formatter: formatTooltip,
        },
        legend: getLegendOption(isNarrowScreen.value, models),
        ...getAxisOption(dates),
        series: models.map((modelName) => ({
          name: modelName,
          type: 'bar',
          stack: 'total',
          emphasis: {
            focus: 'series',
          },
          data: dates.map((date) => {
            const dayData = costData.value[date]
            let total = 0
            dayData?.forEach((item) => {
              const model = item.models.find((m) => m.name === modelName)
              if (model) {
                total += model.tokens
              }
            })
            return total
          }),
        })),
      }
    } else {
      // 总使用量视图
      const types: LLMType[] = ['chat', 'reranker', 'embedding', 'text-to-image']

      return {
        ...getBaseChartOption(isNarrowScreen.value),
        tooltip: {
          ...getBaseChartOption(isNarrowScreen.value).tooltip,
          formatter: formatTooltip,
        },
        legend: getLegendOption(isNarrowScreen.value, types),
        ...getAxisOption(dates),
        series: types.map((type) => ({
          name: type,
          type: 'bar',
          stack: 'total',
          emphasis: {
            focus: 'series',
          },
          data: dates.map((date) => {
            const dayData = costData.value[date]
            const typeData = dayData?.find((item) => item.type === type)
            return typeData?.totalTokens ?? 0
          }),
        })),
      }
    }
  })

  defineExpose({
    refetch: fetchCostData,
  })
</script>

<template>
  <div class="p-4 border rounded-lg">
    <div class="flex flex-col gap-4 mb-4">
      <!-- 标题和控制选项 -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold">每日使用统计</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ showModelUsage ? '按模型名称展示 Token 使用量' : '按模型种类展示 Token 使用量' }}
          </p>
        </div>
        <div class="flex items-center gap-4">
          <UButton icon="i-heroicons-arrow-path-20-solid" :loading="loading" @click="fetchCostData(false)" size="sm"> 刷新 </UButton>
        </div>
      </div>

      <!-- 日期选择器 -->
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <div class="flex items-center gap-2">
          <span>日期范围</span>
          <DateRangeSelector v-model="selectedDateRange" />
        </div>
        <div class="flex items-center gap-2">
          <span>模型视图</span>
          <USwitch size="sm" v-model="showModelUsage" />
        </div>
      </div>
    </div>

    <v-chart ref="chartRef" class="!h-[400px]" :option="chartOption" :loading />
  </div>
</template>
