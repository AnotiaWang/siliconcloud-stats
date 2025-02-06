<script setup lang="ts">
  import {
    TooltipComponent,
    GridComponent,
    LegendComponent,
  } from 'echarts/components'
  import { BarChart } from 'echarts/charts'
  import { use } from 'echarts/core'
  import type { DailyBillResults, LLMType } from '~~/types/logic'
  import type { EChartsOption } from 'echarts'
  import type { VChart } from '#components'

  const props = defineProps<{
    data: DailyBillResults
  }>()

  // 注册 echarts 插件
  use([TooltipComponent, GridComponent, LegendComponent, BarChart])

  const colorMode = useColorMode()

  const chartRef = ref<InstanceType<typeof VChart>>()
  useChartAutoResize(chartRef)
  const isDark = computed(() => colorMode.value === 'dark')

  // 总使用量图表配置
  const totalUsageOption = computed<EChartsOption>(() => {
    if (!props.data) return {}

    const dates = Object.keys(props.data).sort()
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
          const dayData = props.data[date]
          const typeData = dayData?.find((item) => item.type === type)
          return typeData?.totalTokens ?? 0
        }),
      })),
    }
  })
</script>

<template>
  <div class="p-4 border rounded-lg">
    <h2 class="text-xl font-semibold mb-4">每日总使用量</h2>
    <v-chart ref="chartRef" class="!h-[400px]" :option="totalUsageOption" />
  </div>
</template>
