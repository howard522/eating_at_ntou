import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import debounce from 'lodash-es/debounce'
import { useUserStore } from '@stores/user'

// 使用範例請見 app/pages/customer/stores/index.vue
interface UseInfiniteFetchOptions<T> {
    /** API 路徑 */
    api: string
    /** 單次載入的筆數 */
    limit?: number
    /** 查詢參數 */
    buildQuery: (skip: number) => Record<string, any>
    /** 滾動偵測防抖延遲 */
    scrollDelay?: number
    /** 是否立即執行初次載入 */
    immediate?: boolean
}

export function useInfiniteFetch<T>(options: UseInfiniteFetchOptions<T>) {
    const {
        api,
        limit = 20,
        buildQuery,
        scrollDelay = 200,
        immediate = true
    } = options

    const userStore = useUserStore()

    const allItems = ref<T[]>([])
    const offset = ref(0)
    const hasMore = ref(true)
    const pending = ref(false)
    const loadingMore = ref(false)
    const error = ref<unknown>(null)

    /** 主要載入函式 */
    const fetchItems = async ({ reset = false } = {}) => {
        if (pending.value || loadingMore.value) return
        if (!hasMore.value && !reset) return

        if (reset) {
            hasMore.value = true
            offset.value = 0
            pending.value = true
        } else {
            loadingMore.value = true
        }

        error.value = null

        try {
            const query = buildQuery(offset.value)
            const headers: Record<string, string> = {}
            if (userStore.token) {
                headers.Authorization = `Bearer ${userStore.token}`
            }
            const response = await $fetch<{ data: T[]; count?: number }>(api, { query, headers })
            const items = response.data ?? []

            if (reset) {
                allItems.value = items
                offset.value = items.length
            } else {
                allItems.value.push(...items)
                offset.value += items.length
            }

            hasMore.value = items.length >= limit
        } catch (e) {
            console.error('載入資料失敗:', e)
            error.value = e
        } finally {
            pending.value = false
            loadingMore.value = false
            nextTick(() => {
                if (hasMore.value && document.documentElement.scrollHeight <= window.innerHeight) {
                    fetchItems()
                }
            })
        }
    }

    /** 滾動監聽 */
    const handleScroll = debounce(() => {
        if (!hasMore.value || loadingMore.value) return
        const bottom = Math.ceil(window.innerHeight + window.pageYOffset)
        const height = document.documentElement.scrollHeight
        if (bottom >= height - 100) {
            fetchItems()
        }
    }, scrollDelay)

    onMounted(() => {
        window.addEventListener('scroll', handleScroll)
        if (immediate) fetchItems({ reset: true })
    })
    onUnmounted(() => {
        window.removeEventListener('scroll', handleScroll)
    })

    return {
        items: computed(() => allItems.value),
        pending,
        loadingMore,
        hasMore,
        error,
        fetchItems
    }
}
