-- 1. Extender enum app_role con los roles funcionales
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'provider';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';