<script setup lang="ts">
  import {
    DateFormatter,
    getLocalTimeZone,
    today,
    type CalendarDate,
  } from '@internationalized/date'

  export interface DateRange {
    start: CalendarDate
    end: CalendarDate
  }

  const selected = defineModel<DateRange>({
    required: true,
  })

  const df = new DateFormatter('zh-CN', { dateStyle: 'medium' })

  const ranges = [
    { label: '最近一周', days: 7 },
    { label: '最近两周', days: 14 },
    { label: '最近三周', days: 21 },
    { label: '最近一个月', days: 30 },
    { label: '最近三个月', days: 90 },
    { label: '最近一年', days: 365 },
  ]

  function isRangeSelected(days: number) {
    const now = today(getLocalTimeZone())
    const start = now.subtract({ days })
    return (
      selected.value.start?.compare(start) === 0 &&
      selected.value.end?.compare(now) === 0
    )
  }

  function selectRange(days: number) {
    const now = today(getLocalTimeZone())
    selected.value = {
      start: now.subtract({ days }),
      end: now,
    }
  }
</script>

<template>
  <UPopover>
    <UButton icon="i-heroicons-calendar-days-20-solid">
      <!-- Nuxt UI 可能有 bug，在选择日期过程中两个值都会变成 undefined -->
      <template v-if="selected.start && selected.end">
        {{ df.format(selected.start.toDate(getLocalTimeZone())) }} ~
        {{ df.format(selected.end.toDate(getLocalTimeZone())) }}
      </template>
    </UButton>

    <template #content>
      <div
        class="flex items-center sm:divide-x divide-gray-200 dark:divide-gray-800"
      >
        <div class="hidden sm:flex flex-col py-4">
          <UButton
            v-for="(range, index) in ranges"
            :key="index"
            :label="range.label"
            color="neutral"
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

        <UCalendar
          v-model="selected"
          class="p-3"
          :number-of-months="2"
          range
        ></UCalendar>
      </div>
    </template>
  </UPopover>
</template>
