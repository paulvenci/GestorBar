const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const path = require('path');

// Necesitamos ejecutar supabase desde la raíz del proyecto
const projectRoot = path.resolve(__dirname, '..', '..'); 

try {
  console.log('Obteniendo configuración de Supabase...');
  // Ejecutar en la raíz del proyecto
  const output = execSync('supabase status -o json', { cwd: projectRoot, encoding: 'utf8' });
  
  // Limpiar output de posibles mensajes de log previos al JSON
  const jsonStart = output.indexOf('{');
  const jsonEnd = output.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No se pudo parsear el output JSON de supabase status. Output recibido: ' + output.substring(0, 100) + '...');
  }
  
  const jsonStr = output.substring(jsonStart, jsonEnd + 1);
  let status;
  try {
      status = JSON.parse(jsonStr);
  } catch (parseError) {
      console.error('Error parseando JSON. Intentando limpiar caracteres extraños...');
      // A veces hay caracteres extraños, intento simple de limpieza si falla
      try {
        status = JSON.parse(jsonStr.replace(/[^\x20-\x7E\s]/g, ''));
      } catch (e2) {
        throw new Error('JSON inválido incluso tras limpieza.');
      }
  }
  
  const supabaseUrl = status.API_URL;
  const serviceRoleKey = status.SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('No se encontraron API_URL o SERVICE_ROLE_KEY en el status');
  }
  
  console.log('Conectando a Supabase en:', supabaseUrl);

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  async function main() {
    const email = 'admin@staging.local';
    const password = '1234';

    // 1. Crear usuario en Auth
    console.log(`Creando usuario Auth (${email})...`);
    
    // Primero verificamos si existe para obtener su ID si ya está
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    let userId;
    
    if (!listError) {
        const existing = listData.users.find(u => u.email === email);
        if (existing) {
            console.log('El usuario ya existe en Auth.');
            userId = existing.id;
        }
    }

    if (!userId) {
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nombre: 'Admin Staging' }
        });

        if (createError) {
            console.error('Error creando usuario:', createError);
            return;
        }
        userId = createData.user.id;
        console.log('Usuario creado con ID:', userId);
    }

    // 2. Insertar en tabla usuarios
    console.log('Configurando perfil en tabla publica usuarios...');
    
    // Buscar rol
    const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('id')
        .eq('nombre', 'Administrador')
        .single();
        
    if (rolesError) {
        console.error('No se encontró el rol Administrador:', rolesError);
        return;
    }
    
    // Upsert usuario
    const { error: upsertError } = await supabase
        .from('usuarios')
        .upsert({
            id: userId,
            nombre: 'Admin Staging',
            email: email,
            rol_id: roles.id,
            activo: true,
            pin: '1234'
        });

    if (upsertError) {
        console.error('Error guardando en public.usuarios:', upsertError);
    } else {
        console.log('✅ ¡Usuario Admin creado y configurado exitosamente!');
    }
  }

  main();

} catch (e) {
  console.error('Error fatal:', e);
}
