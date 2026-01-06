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

    // Verify user has permission to create users
    const { data: currentUser } = await supabaseAdmin
      .from('usuarios')
      .select('*, rol:roles(*, permisos:rol_permisos(permiso:permisos(*)))')
      .eq('id', user.id)
      .single()

    if (!currentUser) {
      throw new Error('Usuario no encontrado en la base de datos')
    }

    // Check if user has 'usuarios.crear' permission
    const hasPermission = currentUser.rol?.permisos?.some(
      (rp: any) => rp.permiso?.codigo === 'usuarios.crear'
    )

    if (!hasPermission) {
      throw new Error('No tienes permisos para crear usuarios')
    }

    // Get request body
    const { email, password, nombre, rol_id, activo, pin } = await req.json()

    // Validate required fields
    if (!email || !password || !nombre || !rol_id) {
      throw new Error('Faltan campos requeridos: email, password, nombre, rol_id')
    }

    // Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre
      }
    })

    if (authError) {
      throw new Error(`Error al crear usuario en Auth: ${authError.message}`)
    }

    // Create user in usuarios table
    const { data: userData, error: userInsertError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: authData.user.id,
        nombre,
        email,
        rol_id,
        activo: activo ?? true,
        pin: pin || null
      })
      .select('*, rol:roles(*)')
      .single()

    if (userInsertError) {
      // If insert fails, delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Error al crear usuario en BD: ${userInsertError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: userData,
        message: 'Usuario creado correctamente'
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
