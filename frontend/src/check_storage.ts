
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY')
    throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkBuckets() {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) {
        console.error('Error listando buckets:', error)
    } else {
        console.log('Buckets disponibles:', data)
        const productosBucket = data.find(b => b.name === 'productos')
        if (productosBucket) {
            console.log('✅ Bucket "productos" encontrado.')
        } else {
            console.log('❌ Bucket "productos" NO encontrado. Se debe crear manualemente o via SQL si es posible.')
        }
    }
}

checkBuckets()
