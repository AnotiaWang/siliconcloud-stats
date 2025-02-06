<script setup lang="ts">
  import type { DailyBillResults } from '~~/types/logic'
  import {
    TooltipComponent,
    GridComponent,
    LegendComponent,
  } from 'echarts/components'
  import { BarChart } from 'echarts/charts'
  import { use } from 'echarts/core'
  import type { EChartsOption } from 'echarts'
  import type { VChart } from '#components'

  const props = defineProps<{
    data: DailyBillResults
  }>()

  // 注册 echarts 插件
  use([TooltipComponent, GridComponent, LegendComponent, BarChart])

  const colorMode = useColorMode()
  const chartRef = ref<InstanceType<typeof VChart>>()
  const { isNarrowScreen } = useChartAutoResize(chartRef)
  const isDark = computed(() => colorMode.value === 'dark')

  // 模型使用量图表配置
  const modelUsageOption = computed<EChartsOption>(() => {
    if (!props.data) return {}

    const dates = Object.keys(props.data).sort()

    // 收集所有日期中出现的模型
    const modelSet = new Set<string>()
    Object.values(props.data).forEach((dayData) => {
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
          const dayData = props.data[date]
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
</script>

<template>
  <div class="p-4 border rounded-lg">
    <h2 class="text-xl font-semibold mb-4">模型使用量分布</h2>
    <v-chart ref="chartRef" class="!h-[400px]" :option="modelUsageOption" />
  </div>
</template>
