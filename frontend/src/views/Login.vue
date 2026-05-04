<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 m-4">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div v-if="configStore.logoUrl" class="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100">
          <img :src="configStore.logoUrl" class="w-full h-full object-cover" />
        </div>
        <h1 class="text-3xl font-bold text-primary-600 mb-2">{{ configStore.nombreNegocio || 'POS System' }}</h1>
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
        <p>Sistema de Punto de Venta v{{ appVersion }}</p>
      </div>
      <!-- Modal Autorización (Capa superpuesta al div interior) -->
      <div v-if="requiresAuth" class="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center rounded-2xl p-8 text-center backdrop-blur-sm">
        <div class="bg-red-100 text-red-600 rounded-full p-4 mb-4">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Caja Cerrada</h2>
        <p class="text-gray-600 mb-6">El turno de este usuario ya fue cerrado hoy. Ingrese PIN de Administrador para autorizar la reapertura.</p>
        
        <input
          v-model="adminPin"
          type="password"
          class="w-full px-4 py-3 text-center tracking-widest text-2xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-4"
          placeholder="••••"
          maxlength="6"
        />

        <div class="flex gap-3 w-full">
          <button @click="cancelAuthorize" class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button @click="handleAuthorize" :disabled="loading" class="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50">
            {{ loading ? '...' : 'Autorizar' }}
          </button>
        </div>
        
        <p v-if="error" class="text-red-500 mt-4 text-sm">{{ error }}</p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConfiguracionStore } from '@/stores/configuracion'
import { useTurnoStore } from '@/stores/turno'
import packageJson from '../../package.json'

const router = useRouter()
const authStore = useAuthStore()
const configStore = useConfiguracionStore()
const turnoStore = useTurnoStore()

const appVersion = packageJson.version

// Estado
const loginMode = ref<'email' | 'pin'>('email')
const loading = ref(false)
const error = ref('')

// Autorización
const requiresAuth = ref(false)
const adminPin = ref('')

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

  if (result.success) {
    // Iniciar/Verificar Turno Automático
    const turnoRes = await turnoStore.verificarYAutoIniciarTurno()
    loading.value = false

    if (turnoRes.requiresAuth) {
      requiresAuth.value = true
      error.value = 'Turno ya fue cerrado hoy. Se requiere autorización para reabrir.'
      return
    }

    if (turnoRes.success) {
      router.push(getDefaultRoute())
    } else {
      error.value = turnoRes.error || 'Error al iniciar el turno'
      await authStore.logout() // Desloguear si no se pudo iniciar turno
    }
  } else {
    loading.value = false
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

  if (result.success) {
    // Iniciar/Verificar Turno Automático
    const turnoRes = await turnoStore.verificarYAutoIniciarTurno()
    loading.value = false

    if (turnoRes.requiresAuth) {
      requiresAuth.value = true
      error.value = 'Turno ya fue cerrado hoy. Se requiere autorización para reabrir.'
      return
    }

    if (turnoRes.success) {
      router.push(getDefaultRoute())
    } else {
      error.value = turnoRes.error || 'Error al iniciar el turno'
      await authStore.logout() // Desloguear si no se pudo iniciar turno
      clearPin()
    }
  } else {
    loading.value = false
    error.value = result.error || 'PIN incorrecto'
    clearPin()
  }
}

async function handleAuthorize() {
  if (!adminPin.value) {
    error.value = 'Por favor ingresa un PIN de autorización'
    return
  }

  loading.value = true
  error.value = ''

  const result = await turnoStore.verificarYAutoIniciarTurno(adminPin.value)

  loading.value = false

  if (result.success) {
    requiresAuth.value = false
    router.push(getDefaultRoute())
  } else {
    error.value = result.error || 'PIN incorrecto o sin permisos'
  }
}

async function cancelAuthorize() {
  requiresAuth.value = false
  adminPin.value = ''
  error.value = ''
  await authStore.logout()
}

// Determinar la ruta por defecto según permisos
function getDefaultRoute() {
  if (authStore.canAccessDashboard) return '/'
  if (authStore.canAccessPOS) return '/pos'
  if (authStore.canAccessTables) return '/mesas'
  if (authStore.canAccessProducts) return '/productos'
  if (authStore.canAccessInventory) return '/inventario'
  if (authStore.canAccessReports) return '/reportes'
  return '/' // fallback
}

// Focus inicial en el primer input de PIN
onMounted(() => {
  if (loginMode.value === 'pin') {
    pinInputs.value[0]?.focus()
  }
})
</script>
