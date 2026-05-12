-- Modo de servicio del creador: 'presencial' (citas) o 'contenido' (venta de contenido)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS service_mode text NOT NULL DEFAULT 'presencial';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_service_mode_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_service_mode_check
  CHECK (service_mode IN ('presencial', 'contenido'));

CREATE INDEX IF NOT EXISTS idx_profiles_service_mode ON public.profiles(service_mode);