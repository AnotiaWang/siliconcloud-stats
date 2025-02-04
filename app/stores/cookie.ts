import { useLocalStorage } from '@vueuse/core'

export const useCookieStore = defineStore('cookie', () => {
  const cookie = useLocalStorage<string>('cookie', '', {
    initOnMounted: true,
  })

  return {
    cookie,
  }
})
