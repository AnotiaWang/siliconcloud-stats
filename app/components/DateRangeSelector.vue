<script setup lang="ts">
  export interface DateRange {
    start: Date
    end: Date
  }

  const colorMode = useColorMode()
  const dayjs = useDayjs()
  const selected = defineModel<DateRange>({
    required: true,
  })

  const ranges = [
    { label: '最近一周', days: 7 },
    { label: '最近两周', days: 14 },
    { label: '最近三周', days: 21 },
    { label: '最近一个月', days: 30 },
    { label: '最近三个月', days: 90 },
    { label: '最近一年', days: 365 },
  ]

  function isRangeSelected(days: number) {
    return (
      dayjs(selected.value.start).isSame(
        dayjs().subtract(days, 'day'),
        'day',
      ) && dayjs(selected.value.end).isSame(new Date(), 'day')
    )
  }

  function selectRange(days: number) {
    selected.value = {
      start: dayjs().subtract(days, 'day').toDate(),
      end: new Date(),
    }
  }
</script>

<template>
  <UPopover :popper="{ placement: 'bottom-start' }">
    <UButton icon="i-heroicons-calendar-days-20-solid">
      {{ dayjs(selected.start).format('YYYY-MM-DD') }} ~
      {{ dayjs(selected.end).format('YYYY-MM-DD') }}
    </UButton>

    <template #panel>
      <div
        class="flex items-center sm:divide-x divide-gray-200 dark:divide-gray-800"
      >
        <div class="hidden sm:flex flex-col py-4">
          <UButton
            v-for="(range, index) in ranges"
            :key="index"
            :label="range.label"
            color="gray"
            variant="ghost"
            class="rounded-none px-6"
            :class="[
              isRangeSelected(range.days)
                ? 'bg-gray-100 dark:bg-gray-800'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
            ]"
            truncate
            @click="selectRange(range.days)"
          />
        </div>

        <VDatePicker
          v-model="selected"
          :model-modifiers="{ range: true }"
          :is-dark="colorMode.preference === 'dark'"
        />
      </div>
    </template>
  </UPopover>
</template>
