import { useRouter } from 'vue-router'

const showAd = ref(false)
const startTime = ref(Date.now())
const silenceUntil = ref(0)
const intervalId = ref<number | null>(null)
let initialized = false
let routerBound = false

const checkAdProbability = () => {
    if (showAd.value) return

    const now = Date.now()
    if (now < silenceUntil.value) return

    const elapsedMinutes = (now - startTime.value) / (1000 * 60)
    let probability = 0

    if (elapsedMinutes >= 8) {
        probability = 1
    } else if (elapsedMinutes >= 3) {
        probability = (elapsedMinutes - 3) / 5
    }

    if (Math.random() < probability) {
        showAd.value = true
    }
}

const resetTimer = () => {
    startTime.value = Date.now()
    silenceUntil.value = Date.now() + 5000
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
    intervalId.value = window.setInterval(checkAdProbability, 60 * 1000)

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
        silenceUntil.value = Date.now() + 5000
    })
    routerBound = true
}

export function useAdPopup() {
    init()
    bindRouterGuard()
    return {
        showAd,
        closeAd,
    }
}
