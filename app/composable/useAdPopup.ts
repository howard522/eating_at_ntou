import { useRouter } from 'vue-router'
export interface AdPopupOptions {
    /** minutes before starting to ramp up probability (default 3) */
    rampStartMinutes?: number
    /** ramp duration in minutes from rampStart to reach 100% (default 5) */
    rampDurationMinutes?: number
    /** how often to check probability, ms (default 30_000) */
    checkIntervalMs?: number
    /** silence duration after certain events, ms (default 5_000) */
    silenceMs?: number
}

const defaultOptions: Required<AdPopupOptions> = {
    rampStartMinutes: 3,
    rampDurationMinutes: 5,
    checkIntervalMs: 30 * 1000,
    silenceMs: 5000,
}

const showAd = ref(false)
const startTime = ref(Date.now())
const silenceUntil = ref(0)
const intervalId = ref<number | null>(null)
let initialized = false
let routerBound = false
let config: Required<AdPopupOptions> = { ...defaultOptions }

const checkAdProbability = () => {
    if (showAd.value) return

    const now = Date.now()
    if (now < silenceUntil.value) return

    const elapsedMinutes = (now - startTime.value) / (1000 * 60)
    const rampStart = config.rampStartMinutes
    const rampDuration = config.rampDurationMinutes
    const rampEnd = rampStart + rampDuration
    let probability = 0

    if (elapsedMinutes >= rampEnd) {
        probability = 1
    } else if (elapsedMinutes >= rampStart) {
        probability = (elapsedMinutes - rampStart) / rampDuration
    }

    if (Math.random() < probability) {
        showAd.value = true
    }
}

const resetTimer = () => {
    startTime.value = Date.now()
    silenceUntil.value = Date.now() + config.silenceMs
}

const closeAd = () => {
    showAd.value = false
    resetTimer()
}

function init() {
    if (initialized || typeof window === 'undefined') return
    initialized = true

    if (intervalId.value) {
        clearInterval(intervalId.value)
    }
    intervalId.value = window.setInterval(checkAdProbability, config.checkIntervalMs)

    if (import.meta && import.meta.hot) {
        import.meta.hot.dispose(() => {
            if (intervalId.value) clearInterval(intervalId.value)
            intervalId.value = null
            initialized = false
        })
    }

    window.addEventListener('beforeunload', () => {
        if (intervalId.value) clearInterval(intervalId.value)
        intervalId.value = null
        initialized = false
    })
}

function bindRouterGuard() {
    if (routerBound) return
    const router = useRouter()
    router.afterEach(() => {
        showAd.value = false
        resetTimer()
        silenceUntil.value = Date.now() + config.silenceMs
    })
    routerBound = true
}

export function useAdPopup(options?: AdPopupOptions) {
    config = { ...config, ...(options || {}) }
    init()
    bindRouterGuard()

    return {
        showAd,
        closeAd,
    }
}
