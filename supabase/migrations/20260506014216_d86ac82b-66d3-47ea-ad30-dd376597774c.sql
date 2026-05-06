
CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  visitor_id uuid,
  visitor_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_site_visits_created ON public.site_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_fp ON public.site_visits(visitor_fingerprint);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a site visit"
  ON public.site_visits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read site visits"
  ON public.site_visits FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
