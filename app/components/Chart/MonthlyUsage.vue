<script setup lang="ts">
  import {
    TooltipComponent,
    GridComponent,
    LegendComponent,
  } from 'echarts/components'
  import { BarChart } from 'echarts/charts'
  import { use } from 'echarts/core'
  import type { EChartsOption } from 'echarts'
  import type { VChart } from '#components'
  import type {
    MonthlyModelBillResult,
    MonthlyApikeyBillResult,
  } from '~~/types/logic'

  const colorMode = useColorMode()
  const chartRef = ref<InstanceType<typeof VChart>>()
  const { isNarrowScreen } = useChartAutoResize(chartRef)
  const isDark = computed(() => colorMode.value === 'dark')

  // 是否按 API Key 分组显示
  const showByApiKey = ref(false)
  // 选择的年份
  const currentYear = new Date().getFullYear()
  const selectedYear = ref(currentYear.toString())
  // 年份选项，从 2024 年开始
  const yearOptions = Array.from({ length: currentYear - 2023 }, (_, i) => {
    return String(2024 + i)
  })

  // 注册 echarts 插件
  use([TooltipComponent, GridComponent, LegendComponent, BarChart])

  // 存储每个月的数据
  const monthlyData = ref<
    Record<string, MonthlyModelBillResult[] | MonthlyApikeyBillResult[]>
  >({})

  // 计算当前年份的所有月份（到当前月份为止）
  const months = computed(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const endMonth =
      selectedYear.value === currentYear.toString() ? now.getMonth() + 1 : 12
    return Array.from({ length: endMonth }, (_, i) => {
      const month = String(i + 1).padStart(2, '0')
      return `${selectedYear.value}-${month}`
    })
  })

  // 加载数据
  const loading = ref(false)
  const toast = useToast()
  const cookieStore = useCookieStore()

  const fetchMonthData = async (month: string) => {
    if (!cookieStore.cookie) return null

    const endpoint = showByApiKey.value
      ? '/api/monthly-bills-apikey'
      : '/api/monthly-bills-model'
    const data = await $fetch(endpoint, {
      method: 'POST',
      body: {
        cookie: cookieStore.cookie,
        month,
      },
    })
    return data
  }

  const fetchAllData = async () => {
    if (!cookieStore.cookie) {
      return // 不用 toast 了，index.vue 里面提示过了
    }
    if (loading.value) return

    loading.value = true
    try {
      monthlyData.value = {}

      // 串行请求所有月份的数据
      for (const month of months.value) {
        try {
          const data = await fetchMonthData(month)
          monthlyData.value[month] = data
        } catch (error) {
          console.error(`请求 ${month} 时出错`, error)
        }
      }
    } catch (error: any) {
      console.error(error)
      toast.add({
        title: '获取月度统计数据失败',
        description: error.message || '未知错误',
        color: 'error',
      })
    } finally {
      loading.value = false
    }
  }

  // 监听年份和开关变化，重新获取数据
  watch([selectedYear, showByApiKey], () => {
    fetchAllData()
  })

  // 组件挂载时获取数据
  onNuxtReady(() => {
    fetchAllData()
  })

  // 图表配置
  const chartOption = computed<EChartsOption>(() => {
    if (loading.value) return {}

    const commonLegendOptions: EChartsOption['legend'] = {
      type: 'scroll',
      orient: isNarrowScreen.value ? 'horizontal' : 'vertical',
      left: isNarrowScreen.value ? 'center' : '70%',
      top: isNarrowScreen.value ? 0 : 'middle',
      width: isNarrowScreen.value ? '90%' : 'auto',
      height: isNarrowScreen.value ? 'auto' : '80%',
      pageButtonPosition: isNarrowScreen.value ? 'end' : 'start',
      textStyle: { color: isDark.value ? '#fff' : '#000' },
    }
    const gridOptions: EChartsOption['grid'] = {
      left: isNarrowScreen.value ? '5%' : '5%',
      right: isNarrowScreen.value ? '5%' : '32%',
      top: '80',
      containLabel: true,
    }

    if (showByApiKey.value) {
      // API Key 视图
      // 收集所有月份中出现的 API Keys
      const apiKeySet = new Set<string>()
      Object.values(monthlyData.value).forEach((data) => {
        ;(data as MonthlyApikeyBillResult[]).forEach((item) => {
          apiKeySet.add(item.name)
        })
      })
      const apiKeys = Array.from(apiKeySet)

      return {
        animation: true,
        animationDuration: 500,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const month = params[0].name
            let result = `<b>${month}</b><br/>`
            let total = 0

            // 按消费金额从大到小排序
            const sortedParams = [...params].sort((a, b) => b.value - a.value)

            sortedParams.forEach((param) => {
              if (param.value > 0) {
                result += `<div class="flex items-center justify-between gap-4">
                  <div>${param.marker}${param.seriesName}</div>
                  <div class="font-bold">¥ ${param.value}</div>
                </div>`
                total += param.value
              }
            })

            if (params.length > 1) {
              result += `<div class="mt-2 pt-2 border-t border-gray-200">
                <div class="flex items-center justify-between gap-4">
                  <div>总计</div>
                  <div class="font-bold">¥ ${total}</div>
                </div>
              </div>`
            }

            return result
          },
        },
        legend: {
          ...commonLegendOptions,
          data: apiKeys,
        },
        grid: gridOptions,
        xAxis: {
          type: 'category',
          data: months.value,
          axisLabel: {
            color: isDark.value ? '#fff' : '#000',
            interval: 0,
            rotate: 45,
          },
        },
        yAxis: {
          type: 'value',
          name: '金额 (¥)',
          nameTextStyle: { color: isDark.value ? '#fff' : '#000' },
          axisLabel: {
            color: isDark.value ? '#fff' : '#000',
            formatter: (value: number) => value.toFixed(4),
          },
        },
        series: apiKeys.map((name) => ({
          name,
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: months.value.map((month) => {
            const monthData = monthlyData.value[
              month
            ] as MonthlyApikeyBillResult[]
            const item = monthData?.find((d) => d.name === name)
            return item?.price || 0
          }),
        })),
      } satisfies EChartsOption
    } else {
      // 模型视图
      // 收集所有月份中出现的模型
      const modelSet = new Set<string>()
      Object.values(monthlyData.value).forEach((data) => {
        ;(data as MonthlyModelBillResult[]).forEach((item) => {
          modelSet.add(item.modelName)
        })
      })
      const models = Array.from(modelSet)

      return {
        animation: true,
        animationDuration: 500,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
        },
        legend: {
          ...commonLegendOptions,
          data: models,
        },
        grid: gridOptions,
        xAxis: {
          type: 'category',
          data: months.value,
          axisLabel: {
            color: isDark.value ? '#fff' : '#000',
            interval: 0,
            rotate: 45,
          },
        },
        yAxis: {
          type: 'value',
          name: 'Token 数量',
          nameTextStyle: { color: isDark.value ? '#fff' : '#000' },
          axisLabel: { color: isDark.value ? '#fff' : '#000' },
        },
        series: models.map((modelName) => ({
          name: modelName,
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: months.value.map((month) => {
            const monthData = monthlyData.value[
              month
            ] as MonthlyModelBillResult[]
            const item = monthData?.find((m) => m.modelName === modelName)
            return item ? parseInt(item.tokens) : 0
          }),
        })),
      } satisfies EChartsOption
    }
  })

  defineExpose({ refetch: fetchAllData })
</script>

<template>
  <div class="p-4 border rounded-lg">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-xl font-semibold">月度使用统计</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{
            showByApiKey ? '按 API Key 展示消费金额' : '按模型展示 Token 使用量'
          }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm">年份</span>
        <USelect
          v-model="selectedYear"
          :items="yearOptions"
          :disabled="loading"
          size="sm"
        />
        <span class="text-sm">API key 视图</span>
        <USwitch v-model="showByApiKey" :disabled="loading"> </USwitch>
      </div>
    </div>
    <div v-if="loading" class="h-[400px] flex items-center justify-center">
      <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin" />
      加载中...
    </div>
    <v-chart ref="chartRef" class="!h-[400px]" :option="chartOption" />
  </div>
</template>
