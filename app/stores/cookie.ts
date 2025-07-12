import { useLocalStorage } from '@vueuse/core'

export const useCookieStore = defineStore('cookie', () => {
  const cookie = useLocalStorage<string>('cookie', '', {
    initOnMounted: true,
  })
  const subjectId = useLocalStorage<string>('subjectId', '', {
    initOnMounted: true,
  })

  return {
    cookie,
    subjectId,
  }
})
