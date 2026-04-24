-- Fix search_path warning on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Tighten profile-photos bucket: prevent listing, allow individual file access via URL only
DROP POLICY IF EXISTS "Public read profile photos" ON storage.objects;

-- Storage object policies still required so direct URL fetch works (bucket is public).
-- Public buckets serve files directly via URL without RLS evaluation, so we don't need a SELECT policy.
-- We keep owner-only write policies that already exist.
