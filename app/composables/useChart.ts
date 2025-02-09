import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import { BarChart } from 'echarts/charts'
import { use } from 'echarts/core'
import type { EChartsOption } from 'echarts'

// 注册 echarts 插件
use([TooltipComponent, GridComponent, LegendComponent, BarChart])

export function useChart() {
  const colorMode = useColorMode()
  const isDark = computed(() => colorMode.value === 'dark')

  // 获取基础的图表配置
  const getBaseChartOption = (
    isNarrowScreen: boolean,
  ): Partial<EChartsOption> => {
    return {
      animation: true,
      animationDuration: 500,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: isNarrowScreen ? '5%' : '5%',
        right: isNarrowScreen ? '5%' : '32%',
        top: '80',
        containLabel: true,
      },
    }
  }

  // 获取图例配置
  const getLegendOption = (
    isNarrowScreen: boolean,
    data: string[],
  ): EChartsOption['legend'] => {
    return {
      type: 'scroll',
      orient: isNarrowScreen ? 'horizontal' : 'vertical',
      left: isNarrowScreen ? 'center' : '70%',
      top: isNarrowScreen ? 0 : 'middle',
      width: isNarrowScreen ? '90%' : 'auto',
      height: isNarrowScreen ? 'auto' : '80%',
      pageButtonPosition: isNarrowScreen ? 'end' : 'start',
      data,
      textStyle: {
        color: isDark.value ? '#fff' : '#000',
      },
    }
  }

  // 获取坐标轴配置
  const getAxisOption = (
    data: string[],
    name = 'Token 数量',
  ): Pick<EChartsOption, 'xAxis' | 'yAxis'> => {
    return {
      xAxis: {
        type: 'category',
        data,
        axisLabel: {
          color: isDark.value ? '#fff' : '#000',
          interval: 0,
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name,
        nameTextStyle: {
          color: isDark.value ? '#fff' : '#000',
        },
        axisLabel: {
          color: isDark.value ? '#fff' : '#000',
        },
      },
    }
  }

  // 格式化 tooltip
  const formatTooltip = (params: any[]) => {
    const date = params[0].name
    let result = `<b>${date}</b><br/>`
    let total = 0

    // 按数值从大到小排序
    const sortedParams = [...params].sort((a, b) => b.value - a.value)

    sortedParams.forEach((param) => {
      if (param.value > 0) {
        result += `<div class="flex items-center justify-between gap-4">
          <div>${param.marker}${param.seriesName}</div>
          <div class="font-bold">${param.value}</div>
        </div>`
        total += param.value
      }
    })

    if (params.length > 1) {
      result += `<div class="mt-2 pt-2 border-t border-gray-200">
        <div class="flex items-center justify-between gap-4">
          <div>总计</div>
          <div class="font-bold">${total}</div>
        </div>
      </div>`
    }

    return result
  }

  return {
    isDark,
    getBaseChartOption,
    getLegendOption,
    getAxisOption,
    formatTooltip,
  }
}
