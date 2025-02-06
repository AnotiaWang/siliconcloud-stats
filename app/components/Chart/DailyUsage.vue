<script setup lang="ts">
  import {
    TooltipComponent,
    GridComponent,
    LegendComponent,
  } from 'echarts/components'
  import { BarChart } from 'echarts/charts'
  import { use } from 'echarts/core'
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

  // 注册 echarts 插件
  use([TooltipComponent, GridComponent, LegendComponent, BarChart])

  const colorMode = useColorMode()

  const totalUsageChartRef = ref<InstanceType<typeof VChart>>()
  const modelUsageChartRef = ref<InstanceType<typeof VChart>>()
  useChartAutoResize(totalUsageChartRef)
  const { isNarrowScreen } = useChartAutoResize(modelUsageChartRef)
  const isDark = computed(() => colorMode.value === 'dark')

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

  // 总使用量图表配置
  const totalUsageOption = computed<EChartsOption>(() => {
    if (!costData.value) return {}

    const dates = Object.keys(costData.value).sort()
    const types: LLMType[] = ['chat', 'reranker', 'embedding', 'text-to-image']

    return {
      animation: true,
      animationDuration: 500,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: types,
        textStyle: {
          color: isDark.value ? '#fff' : '#000',
        },
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          color: isDark.value ? '#fff' : '#000',
        },
      },
      yAxis: {
        type: 'value',
        name: 'Token 数量',
        nameTextStyle: {
          color: isDark.value ? '#fff' : '#000',
        },
        axisLabel: {
          color: isDark.value ? '#fff' : '#000',
        },
      },
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
  })

  // 模型使用量图表配置
  const modelUsageOption = computed<EChartsOption>(() => {
    if (!costData.value) return {}

    const dates = Object.keys(costData.value).sort()

    // 收集所有日期中出现的模型
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
      animation: true,
      animationDuration: 500,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        // 用自定义 formatter 只显示非零值
        formatter: function (params: any[]) {
          const date = params[0].name
          let result = `<b>${date}</b><br/>`

          params.forEach((param) => {
            if (param.value) {
              result += `<div class="flex items-center justify-between gap-4">
                <div>${param.marker}${param.seriesName}</div>
                <div class="font-bold">${param.value}</div>
              </div>`
            }
          })

          return result
        } as any,
      },
      grid: {
        left: isNarrowScreen.value ? '5%' : '5%',
        right: isNarrowScreen.value ? '5%' : '32%',
        top: '80',
        containLabel: true,
      },
      legend: {
        type: 'scroll',
        orient: isNarrowScreen.value ? 'horizontal' : 'vertical',
        left: isNarrowScreen.value ? 'center' : '70%',
        top: isNarrowScreen.value ? 0 : 'middle',
        width: isNarrowScreen.value ? '90%' : 'auto',
        height: isNarrowScreen.value ? 'auto' : '80%',
        pageButtonPosition: isNarrowScreen.value ? 'end' : 'start',
        data: models,
        textStyle: {
          color: isDark.value ? '#fff' : '#000',
        },
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          color: isDark.value ? '#fff' : '#000',
        },
      },
      yAxis: {
        type: 'value',
        name: 'Token 数量',
        nameTextStyle: {
          color: isDark.value ? '#fff' : '#000',
        },
        axisLabel: {
          color: isDark.value ? '#fff' : '#000',
        },
      },
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
  })

  defineExpose({
    refetch: fetchCostData,
  })
</script>

<template>
  <div>
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
      <div class="p-4 border rounded-lg">
        <h2 class="text-xl font-semibold mb-4">每日总使用量</h2>
        <v-chart
          ref="totalUsageChartRef"
          class="!h-[400px]"
          :option="totalUsageOption"
        />
      </div>
      <div class="p-4 border rounded-lg">
        <h2 class="text-xl font-semibold mb-4">模型使用量分布</h2>
        <v-chart
          ref="modelUsageChartRef"
          class="!h-[400px]"
          :option="modelUsageOption"
        />
      </div>
    </div>
  </div>
</template>
