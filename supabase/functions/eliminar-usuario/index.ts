import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the user is authenticated and has permission
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Usuario no autenticado')
    }

    // Verify user has permission to delete users
    const { data: currentUser } = await supabaseAdmin
      .from('usuarios')
      .select('*, rol:roles(*, permisos:rol_permisos(permiso:permisos(*)))')
      .eq('id', user.id)
      .single()

    if (!currentUser) {
      throw new Error('Usuario no encontrado en la base de datos')
    }

    // Check if user has 'usuarios.eliminar' permission
    const hasPermission = currentUser.rol?.permisos?.some(
      (rp: any) => rp.permiso?.codigo === 'usuarios.eliminar'
    )

    if (!hasPermission) {
      throw new Error('No tienes permisos para eliminar usuarios')
    }

    // Get request body
    const { usuario_id } = await req.json()

    // Validate required fields
    if (!usuario_id) {
      throw new Error('Falta campo requerido: usuario_id')
    }

    // Prevent self-deletion
    if (usuario_id === user.id) {
      throw new Error('No puedes eliminar tu propio usuario')
    }

    // Delete from usuarios table first (cascade should handle relations)
    const { error: deleteError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', usuario_id)

    if (deleteError) {
      throw new Error(`Error al eliminar usuario de BD: ${deleteError.message}`)
    }

    // Delete from auth.users
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(usuario_id)

    if (authDeleteError) {
      // Log but don't throw - the user is already deleted from usuarios table
      console.error('Error deleting from auth:', authDeleteError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Usuario eliminado correctamente'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
