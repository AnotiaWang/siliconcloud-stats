<script setup lang="ts">
  const emit = defineEmits<{
    (e: 'update'): void
  }>()

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
    toast.add({ title: 'Cookie 已保存', color: 'success', duration: 3000 })
    showCookieModal.value = false
    emit('update')
  }
  const deleteCookie = () => {
    cookieStore.cookie = ''
    toast.add({ title: 'Cookie 已删除', color: 'success', duration: 3000 })
    showCookieModal.value = false
  }

  defineExpose({
    openCookieModal() {
      showCookieModal.value = true
    },
  })
</script>

<template>
  <div>
    <UModal v-model="showCookieModal" title="Cookie 管理">
      <UButton
        :icon="isCookieSet ? '' : 'i-heroicons-information-circle-20-solid'"
        :color="isCookieSet ? 'primary' : 'error'"
        @click="showCookieModal = true"
      >
        {{ isCookieSet ? 'Cookie 管理' : '设置 Cookie' }}
      </UButton>

      <template #body>
        <UFormField label="Cookie 内容">
          <UTextarea v-model="cookie" class="w-full" />
        </UFormField>

        <div
          class="mt-2 flex flex-col text-sm text-gray-700 dark:text-gray-300"
        >
          <div>SiliconCloud 使用 Cookie 鉴权。</div>
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
            color="error"
            variant="ghost"
            @click="deleteCookie"
          >
            删除 Cookie
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
