<script setup lang="ts">
  const cookieStore = useCookieStore()
  const toast = useToast()
  const isCookieSet = computed(() => !!cookieStore.cookie)

  const showCookieModal = ref(false)
  const cookie = ref('')

  watch(showCookieModal, (value) => {
    if (value) {
      cookie.value = cookieStore.cookie
    }
  })

  const saveCookie = () => {
    cookieStore.cookie = cookie.value
    toast.add({ title: 'Cookie 已保存', color: 'green', timeout: 3000 })
    showCookieModal.value = false
  }
  const deleteCookie = () => {
    cookieStore.cookie = ''
    toast.add({ title: 'Cookie 已删除', color: 'green', timeout: 3000 })
    showCookieModal.value = false
  }
</script>

<template>
  <div>
    <UButton
      :icon="isCookieSet ? '' : 'i-heroicons-information-circle-20-solid'"
      :color="isCookieSet ? 'primary' : 'orange'"
      @click="showCookieModal = true"
    >
      {{ isCookieSet ? 'Cookie 管理' : '设置 Cookie' }}
    </UButton>

    <UModal v-model="showCookieModal">
      <UCard
        :ui="{
          header: { padding: 'px-4 py-3 sm:px-5' },
          body: { padding: 'p-4 sm:p-5' },
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
          strategy: 'override',
        }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">Cookie 设置</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              @click="showCookieModal = false"
            />
          </div>
        </template>

        <UFormGroup label="Cookie 内容">
          <UTextarea v-model="cookie" />
        </UFormGroup>

        <div
          class="mt-2 flex flex-col text-sm text-gray-700 dark:text-gray-300"
        >
          <div> SiliconCloud 使用 Cookie 鉴权。 </div>
          <div>
            您输入的 Cookie
            保存在您浏览器里，他人无法访问，您可以随时清空。在查询数据时，为了解决跨域问题，您的
            Cookie 会被临时发送到本项目的后端。后端<span
              class="text-red-500 font-bold"
              >不会</span
            >存储任何信息。
          </div>
        </div>

        <div class="flex mt-4 w-full flex-row-reverse gap-x-2">
          <UButton :disabled="!cookie" @click="saveCookie">
            保存 Cookie
          </UButton>
          <UButton
            v-if="isCookieSet"
            color="red"
            variant="ghost"
            @click="deleteCookie"
          >
            删除 Cookie
          </UButton>
        </div>
      </UCard>
    </UModal>
  </div>
</template>
