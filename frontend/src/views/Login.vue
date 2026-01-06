<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 m-4">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-primary-600 mb-2">🍺 Bar Gordy</h1>
        <p class="text-gray-600">Sistema de Punto de Venta</p>
      </div>

      <!-- Tabs -->
      <div class="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          @click="loginMode = 'email'"
          class="flex-1 py-2 rounded-md transition-colors font-medium"
          :class="loginMode === 'email' ? 'bg-white text-primary-600 shadow' : 'text-gray-600'"
        >
          Email
        </button>
        <button
          @click="loginMode = 'pin'"
          class="flex-1 py-2 rounded-md transition-colors font-medium"
          :class="loginMode === 'pin' ? 'bg-white text-primary-600 shadow' : 'text-gray-600'"
        >
          PIN
        </button>
      </div>

      <!-- Login con Email -->
      <form v-if="loginMode === 'email'" @submit.prevent="handleEmailLogin" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="usuario@ejemplo.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Contraseña
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <!-- Login con PIN -->
      <div v-if="loginMode === 'pin'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2 text-center">
            Ingresa tu PIN de 4 dígitos
          </label>
          <div class="flex justify-center gap-3 mb-6">
            <input
              v-for="i in 4"
              :key="i"
              :ref="el => pinInputs[i-1] = el as HTMLInputElement"
              v-model="pinDigits[i-1]"
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              @input="handlePinInput(i-1)"
              @keydown="handlePinKeydown($event, i-1)"
            />
          </div>
        </div>

        <!-- Teclado Numérico -->
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="num in [1,2,3,4,5,6,7,8,9]"
            :key="num"
            type="button"
            @click="addPinDigit(num.toString())"
            class="bg-gray-100 hover:bg-gray-200 text-xl font-bold py-4 rounded-lg transition-colors"
          >
            {{ num }}
          </button>
          <button
            type="button"
            @click="clearPin"
            class="bg-red-100 hover:bg-red-200 text-red-600 font-medium py-4 rounded-lg transition-colors"
          >
            Limpiar
          </button>
          <button
            type="button"
            @click="addPinDigit('0')"
            class="bg-gray-100 hover:bg-gray-200 text-xl font-bold py-4 rounded-lg transition-colors"
          >
            0
          </button>
          <button
            type="button"
            @click="handlePinLogin"
            :disabled="pin.length !== 4 || loading"
            class="bg-primary-600 hover:bg-primary-700 text-white font-medium py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-600 text-sm text-center">{{ error }}</p>
      </div>

      <!-- Footer -->
      <div class="mt-6 text-center text-sm text-gray-500">
        <p>Sistema de Punto de Venta v1.0</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Estado
const loginMode = ref<'email' | 'pin'>('email')
const loading = ref(false)
const error = ref('')

// Login con Email
const email = ref('')
const password = ref('')

// Login con PIN
const pinDigits = ref(['', '', '', ''])
const pinInputs = ref<HTMLInputElement[]>([])

const pin = computed(() => pinDigits.value.join(''))

// Handlers de Email
async function handleEmailLogin() {
  if (!email.value || !password.value) {
    error.value = 'Por favor completa todos los campos'
    return
  }

  loading.value = true
  error.value = ''

  const result = await authStore.login(email.value, password.value)

  loading.value = false

  if (result.success) {
    router.push('/')
  } else {
    error.value = result.error || 'Error al iniciar sesión'
  }
}

// Handlers de PIN
function handlePinInput(index: number) {
  const digit = pinDigits.value[index]
  
  // Solo permitir números
  if (digit && !/^\d$/.test(digit)) {
    pinDigits.value[index] = ''
    return
  }

  // Auto-focus al siguiente input
  if (digit && index < 3) {
    pinInputs.value[index + 1]?.focus()
  }

  // Auto-login cuando se completan los 4 dígitos
  if (pin.value.length === 4) {
    handlePinLogin()
  }
}

function handlePinKeydown(event: KeyboardEvent, index: number) {
  // Backspace: limpiar y volver al anterior
  if (event.key === 'Backspace' && !pinDigits.value[index] && index > 0) {
    pinDigits.value[index - 1] = ''
    pinInputs.value[index - 1]?.focus()
  }
}

function addPinDigit(digit: string) {
  const emptyIndex = pinDigits.value.findIndex(d => d === '')
  if (emptyIndex !== -1) {
    pinDigits.value[emptyIndex] = digit
    pinInputs.value[emptyIndex]?.focus()
    
    // Auto-login cuando se completan los 4 dígitos
    if (emptyIndex === 3) {
      setTimeout(() => handlePinLogin(), 300)
    }
  }
}

function clearPin() {
  pinDigits.value = ['', '', '', '']
  pinInputs.value[0]?.focus()
  error.value = ''
}

async function handlePinLogin() {
  if (pin.value.length !== 4) {
    error.value = 'Por favor ingresa un PIN de 4 dígitos'
    return
  }

  loading.value = true
  error.value = ''

  const result = await authStore.loginWithPIN(pin.value)

  loading.value = false

  if (result.success) {
    router.push('/')
  } else {
    error.value = result.error || 'PIN incorrecto'
    clearPin()
  }
}

// Focus inicial en el primer input de PIN
onMounted(() => {
  if (loginMode.value === 'pin') {
    pinInputs.value[0]?.focus()
  }
})
</script>
