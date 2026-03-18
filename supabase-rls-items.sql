-- ============================================================
-- RLS (Row Level Security) para la tabla items en Supabase
-- ============================================================
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase:
-- https://supabase.com/dashboard/project/TU_PROJECT/sql
--
-- IMPORTANTE: No ejecutes esto hasta que la app use Supabase Auth.
-- Si lo ejecutas sin auth, la app no podrá leer/escribir items.
--
-- Esto protege tu inventario: solo usuarios autenticados podrán
-- ver y modificar sus propias prendas.
-- ============================================================

-- 1. Activar RLS en la tabla items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- 2. Añadir columna user_id si no existe (para vincular prendas al usuario)
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Política: Solo el usuario autenticado puede ver sus propias prendas
CREATE POLICY "Usuarios ven solo sus prendas"
  ON public.items
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Política: Solo el usuario autenticado puede insertar sus propias prendas
CREATE POLICY "Usuarios insertan sus prendas"
  ON public.items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Política: Solo el usuario autenticado puede actualizar sus propias prendas
CREATE POLICY "Usuarios actualizan sus prendas"
  ON public.items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Política: Solo el usuario autenticado puede eliminar sus propias prendas
CREATE POLICY "Usuarios eliminan sus prendas"
  ON public.items
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- PASOS ADICIONALES EN TU APP:
-- 1. Habilita "Anonymous sign-ins" en Supabase:
--    Authentication > Providers > Anonymous > Enable
--
-- 2. En la app, al iniciar sesión (o al abrir por primera vez),
--    llama a supabase.auth.signInAnonymously() para obtener
--    un user_id. Así auth.uid() funcionará en las políticas.
--
-- 3. Al crear/actualizar prendas, incluye user_id = auth.uid()
--    en cada fila.
--
-- 4. Migrar datos existentes (función RPC para la app):
--    Ejecuta esto en el SQL Editor para que la app pueda asociar
--    items con user_id NULL al usuario actual al iniciar.
CREATE OR REPLACE FUNCTION public.migrate_items_to_current_user()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.items SET user_id = auth.uid() WHERE user_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- 5. Migrar datos existentes (alternativa manual):
--    UPDATE public.items SET user_id = 'ID_DEL_USUARIO' WHERE user_id IS NULL;
-- ============================================================
