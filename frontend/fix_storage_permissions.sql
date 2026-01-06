-- ================================================================
-- SCRIPT PARA HABILITAR PERMISOS DE SUBIDA (STORAGE POLICIES)
-- ================================================================
-- Instrucciones:
-- 1. Copia este código.
-- 2. Ve al SQL Editor en tu dashboard de Supabase.
-- 3. Pega y ejecuta (Run).

-- 1. Asegurar que el bucket existe (por si acaso) y es público
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Acceso total a productos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir ver productos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subir productos" ON storage.objects;

-- 3. Crear una política PERMISIVA para el bucket 'productos'.
--    Esto permite INSERT (subir), SELECT (ver), UPDATE y DELETE a cualquiera.
--    Nota: En producción real, querrías restringir esto solo a usuarios logueados.
CREATE POLICY "Acceso total a productos"
ON storage.objects FOR ALL
USING ( bucket_id = 'productos' )
WITH CHECK ( bucket_id = 'productos' );

-- Confirmación
SELECT 'Politicas aplicadas correctamente' as resultado;
