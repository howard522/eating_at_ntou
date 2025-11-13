import { defineStore } from 'pinia'

export const useSnackbarStore = defineStore('snackbar', () => {
    const show = ref(false)
    const text = ref('')
    const color = ref<'success' | 'error' | 'info' | 'warning'>('success')
    const timeout = ref(2500)

    const showSnackbar = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', duration: number = 2500) => {
        text.value = message
        color.value = type
        timeout.value = duration
        show.value = true
    }

    return {
        show,
        text,
        color,
        timeout,
        showSnackbar
    }
})
