import { ref, watch } from 'vue'

// Estado reactivo compartido globalmente
const isActive = ref(false)

// Cargar estado inicial desde localStorage
const savedState = localStorage.getItem('barcodeScannerActive')
if (savedState) {
    isActive.value = savedState === 'true'
}

// Guardar en localStorage cuando cambie
watch(isActive, (newValue) => {
    localStorage.setItem('barcodeScannerActive', newValue.toString())
})

export function useBarcodeScanner() {
    const toggle = () => {
        isActive.value = !isActive.value
    }

    return {
        isActive,
        toggle
    }
}
