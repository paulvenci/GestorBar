<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto">
      <div class="md:flex md:items-center md:justify-between mb-6">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            📦 Gestión de Productos
          </h2>
        </div>
        <div class="mt-4 flex md:ml-4 md:mt-0">
          <button
            @click="openCreateModal"
            class="ml-3 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <span class="mr-2 text-lg">+</span> Nuevo Producto
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar</label>
            <input
              type="text"
              id="search"
              v-model="filters.search"
              placeholder="Nombre o código..."
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
            <select
              id="category"
              v-model="filters.categoryId"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
            >
              <option value="">Todas</option>
              <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
            </select>
          </div>
          <div>
            <label for="type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
            <select
              id="type"
              v-model="filters.type"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
            >
              <option value="">Todos</option>
              <option value="SIMPLE">Simple</option>
              <option value="COMPUESTO">Compuesto</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Product List -->
      <ProductList 
        :products="filteredProducts"
        :categories="categorias"
        :loading="loading" 
        @edit="openEditModal"
        @delete="confirmDelete"
      />

      <!-- Empty State -->
      <div v-if="!loading && filteredProducts.length === 0" class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">No se encontraron productos con los filtros seleccionados.</p>
      </div>

      <!-- Product Form Modal -->
      <ProductForm 
        v-if="showModal"
        :product-to-edit="selectedProduct"
        :categorias="categorias"
        :simple-products="productosSimples"
        @close="closeModal"
        @save="onSave"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import AppLayout from '@/components/layout/AppLayout.vue'
import ProductList from '@/components/modules/products/ProductList.vue'
import ProductForm from '@/components/modules/products/ProductForm.vue'
import { useProductosStore } from '@/stores/productos'
import type { Producto } from '@/types/database.types'

const productosStore = useProductosStore()
const { productos, categorias, loading, productosSimples } = storeToRefs(productosStore)

const filters = ref({
  search: '',
  categoryId: '',
  type: ''
})

const showModal = ref(false)
const selectedProduct = ref<Producto | null>(null)

onMounted(() => {
  productosStore.fetchProductos()
  productosStore.fetchCategorias()
})

const filteredProducts = computed(() => {
  return productos.value.filter(p => {
    // Filter by Search
    const searchMatch = !filters.value.search || 
      p.nombre.toLowerCase().includes(filters.value.search.toLowerCase()) || 
      p.codigo.toLowerCase().includes(filters.value.search.toLowerCase())
    
    // Filter by Category
    const categoryMatch = !filters.value.categoryId || p.categoria_id === filters.value.categoryId
    
    // Filter by Type
    const typeMatch = !filters.value.type || p.tipo_producto === filters.value.type

    return searchMatch && categoryMatch && typeMatch
  })
})

const openCreateModal = () => {
  selectedProduct.value = null
  showModal.value = true
}

const openEditModal = (product: Producto) => {
  selectedProduct.value = product
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedProduct.value = null
}

const onSave = () => {
  productosStore.fetchProductos() // Recargar lista
}

const confirmDelete = async (product: Producto) => {
  if (confirm(`¿Estás seguro de eliminar el producto "${product.nombre}"?`)) {
    const result = await productosStore.deleteProducto(product.id)
    if (!result.success) {
      alert('Error al eliminar producto: ' + result.error)
    }
  }
}
</script>
