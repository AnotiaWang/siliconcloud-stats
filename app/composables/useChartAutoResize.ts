import type { VChart } from '#components'

export const useChartAutoResize = (
  chartRef: Ref<InstanceType<typeof VChart> | undefined>,
) => {
  const isNarrowScreen = ref(false)

  const updateLayout = () => {
    if (!chartRef.value?.$el) return
    isNarrowScreen.value = chartRef.value.$el.clientWidth < 768
    chartRef.value?.resize()
  }

  onMounted(() => {
    updateLayout()
    if (!chartRef.value?.$el) return
    // 监听容器大小变化
    const observer = new ResizeObserver(updateLayout)
    observer.observe(chartRef.value.$el)

    onUnmounted(() => {
      observer.disconnect()
    })
  })

  return {
    isNarrowScreen,
  }
}
