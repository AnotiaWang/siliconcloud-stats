<script setup lang="ts">
  import type { MonthlyModelBillResult, MonthlyApikeyBillResult } from '~~/types/logic'
  import type { EChartsOption } from 'echarts'
  import type { VChart } from '#components'

  const chartRef = ref<InstanceType<typeof VChart>>()
  const { isNarrowScreen } = useChartAutoResize(chartRef)
  const { getBaseChartOption, getLegendOption, getAxisOption, formatTooltip } = useChart()

  // 选择的年份
  const currentYear = new Date().getFullYear()
  const selectedYear = ref(currentYear.toString())
  // 年份选项，从 2024 年开始
  const yearOptions = Array.from({ length: currentYear - 2023 }, (_, i) => {
    return String(2024 + i)
  })

  // 模型类型选项
  const modelTypeOptions = [
    { label: '全部', value: 'all' },
    { label: '对话模型', value: 'chat' },
    { label: '向量模型', value: 'embedding' },
    { label: '重排模型', value: 'reranker' },
    { label: '图像生成', value: 'text-to-image' },
  ]
  const selectedModelType = ref('all')

  // 视图类型选项
  const viewTypeOptions = [
    { label: '按模型名称', value: 'model' },
    { label: '按模型类型', value: 'modelType' },
    { label: '按 API Key', value: 'apiKey' },
  ]
  const selectedViewType = ref('model')

  // 存储每个月的数据
  const monthlyData = ref<Record<string, MonthlyModelBillResult[] | MonthlyApikeyBillResult[]>>({})

  // 计算当前年份的所有月份（到当前月份为止）
  const months = computed(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const endMonth = selectedYear.value === currentYear.toString() ? now.getMonth() + 1 : 12
    return Array.from({ length: endMonth }, (_, i) => {
      const month = String(i + 1).padStart(2, '0')
      return `${selectedYear.value}-${month}`
    })
  })

  // 加载数据
  const loading = ref(false)
  const toast = useToast()
  const cookieStore = useCookieStore()

  const fetchMonthData = async (month: string): Promise<MonthlyModelBillResult[] | MonthlyApikeyBillResult[] | null> => {
    if (!cookieStore.cookie) return null

    let endpoint = '/api/monthly-bills-model'
    if (selectedViewType.value === 'apiKey') {
      endpoint = '/api/monthly-bills-apikey'
    }

    const data = await $fetch(endpoint, {
      method: 'POST',
      body: {
        cookie: cookieStore.cookie,
        month,
        modelType: selectedModelType.value,
      },
    })
    return data as MonthlyModelBillResult[] | MonthlyApikeyBillResult[]
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
          if (data) {
            monthlyData.value[month] = data
          }
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

  // 监听年份和视图类型变化，重新获取数据
  watch([selectedYear, selectedViewType, selectedModelType], () => {
    fetchAllData()
  })

  // 组件挂载时获取数据
  onNuxtReady(() => {
    fetchAllData()
  })

  // 图表配置
  const chartOption = computed<EChartsOption>(() => {
    if (!monthlyData.value) return {}

    if (selectedViewType.value === 'apiKey') {
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
        ...getBaseChartOption(isNarrowScreen.value),
        tooltip: {
          ...getBaseChartOption(isNarrowScreen.value).tooltip,
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
        legend: getLegendOption(isNarrowScreen.value, apiKeys),
        ...getAxisOption(months.value, '金额 (¥)'),
        series: apiKeys.map((name) => ({
          name,
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: months.value.map((month) => {
            const monthData = monthlyData.value[month] as MonthlyApikeyBillResult[]
            const item = monthData?.find((d) => d.name === name)
            return item?.price || 0
          }),
        })),
      }
    } else if (selectedViewType.value === 'modelType') {
      // 模型类型视图
      // 收集所有月份中出现的模型类型
      const modelTypeSet = new Set<string>()
      Object.values(monthlyData.value).forEach((data) => {
        ;(data as MonthlyModelBillResult[]).forEach((item) => {
          modelTypeSet.add(item.subType)
        })
      })
      const modelTypes = Array.from(modelTypeSet)

      return {
        ...getBaseChartOption(isNarrowScreen.value),
        tooltip: {
          ...getBaseChartOption(isNarrowScreen.value).tooltip,
          formatter: formatTooltip,
        },
        legend: getLegendOption(isNarrowScreen.value, modelTypes),
        ...getAxisOption(months.value),
        series: modelTypes.map((type) => ({
          name: type,
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: months.value.map((month) => {
            const monthData = monthlyData.value[month] as MonthlyModelBillResult[]
            // 计算该类型的所有模型的 token 总和
            return monthData ? monthData.filter((m) => m.subType === type).reduce((sum, m) => sum + parseInt(m.tokens), 0) : 0
          }),
        })),
      }
    } else {
      // 模型名称视图
      // 收集所有月份中出现的模型
      const modelSet = new Set<string>()
      Object.values(monthlyData.value).forEach((data) => {
        ;(data as MonthlyModelBillResult[]).forEach((item) => {
          modelSet.add(item.modelName)
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
        ...getAxisOption(months.value),
        series: models.map((modelName) => ({
          name: modelName,
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: months.value.map((month) => {
            const monthData = monthlyData.value[month] as MonthlyModelBillResult[]
            const item = monthData?.find((m) => m.modelName === modelName)
            return item ? parseInt(item.tokens) : 0
          }),
        })),
      }
    }
  })

  defineExpose({ refetch: fetchAllData })
</script>

<template>
  <div class="p-4 border rounded-lg">
    <div class="flex flex-col gap-4 mb-4">
      <!-- 标题和刷新按钮 -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold">月度使用统计</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{
              selectedViewType === 'apiKey'
                ? '按 API Key 展示消费金额'
                : selectedViewType === 'modelType'
                  ? '按模型类型展示 Token 使用量'
                  : '按模型名称展示 Token 使用量'
            }}
          </p>
        </div>
        <UButton icon="i-heroicons-arrow-path-20-solid" :loading="loading" size="sm" @click="fetchAllData"> 刷新 </UButton>
      </div>

      <!-- 控制选项 -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 text-xs">
          <span>年份</span>
          <USelect v-model="selectedYear" :items="yearOptions" :disabled="loading" size="sm" />
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span>视图类型</span>
          <USelect v-model="selectedViewType" :items="viewTypeOptions" :disabled="loading" size="sm" />
        </div>
        <div v-if="selectedViewType === 'model'" class="flex items-center gap-2 text-xs">
          <span>模型类型</span>
          <USelect v-model="selectedModelType" :items="modelTypeOptions" :disabled="loading" size="sm" />
        </div>
      </div>
    </div>

    <v-chart ref="chartRef" class="!h-[400px]" :option="chartOption" :loading />
  </div>
</template>
