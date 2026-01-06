import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Mesa } from '@/types/database.types'

// Store para gestión de mesas
export const useTablesStore = defineStore('tables', {
    state: () => ({
        tables: [] as Mesa[],
        loading: false,
        error: null as string | null
    }),

    getters: {
        sortedTables: (state) => {
            return [...state.tables].sort((a, b) => a.numero - b.numero)
        },
        freeTables: (state) => state.tables.filter(t => t.estado === 'LIBRE'),
        occupiedTables: (state) => state.tables.filter(t => t.estado === 'OCUPADA')
    },

    actions: {
        async fetchTables() {
            this.loading = true
            this.error = null

            const { data, error } = await supabase
                .from('mesas')
                .select('*')
                .order('numero')

            if (error) {
                console.error('Error fetching tables:', error)
                this.error = error.message
            } else {
                this.tables = data || []
            }
            this.loading = false
        },

        async createTable(tableData: Partial<Mesa>) {
            const { data, error } = await supabase
                .from('mesas')
                .insert(tableData)
                .select()
                .single()

            if (error) throw error
            if (data) this.tables.push(data)
            return data
        },

        async updateTable(id: string, updates: Partial<Mesa>) {
            const { data, error } = await supabase
                .from('mesas')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            if (data) {
                const index = this.tables.findIndex(t => t.id === id)
                if (index !== -1) this.tables[index] = data
            }
            return data
        },

        async deleteTable(id: string) {
            const { error } = await supabase
                .from('mesas')
                .delete()
                .eq('id', id)

            if (error) throw error
            const index = this.tables.findIndex(t => t.id === id)
            if (index !== -1) this.tables.splice(index, 1)
        },

        // Subscribe to realtime updates (Opcional para MVP pero recomendado)
        subscribeToTables() {
            return supabase
                .channel('mesas-db-changes')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'mesas' },
                    (payload) => {
                        console.log('Realtime table update:', payload)
                        this.fetchTables() // Simple refresh strategy
                    }
                )
                .subscribe()
        }
    }
})
