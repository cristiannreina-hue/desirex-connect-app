
-- Profile views tracking
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  viewer_id uuid,
  viewer_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_created ON public.profile_views(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_fp ON public.profile_views(profile_id, viewer_fingerprint);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a view"
  ON public.profile_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners and admins can read views"
  ON public.profile_views FOR SELECT
  USING (auth.uid() = profile_id OR has_role(auth.uid(), 'admin'::app_role));

-- Contact clicks tracking
CREATE TABLE IF NOT EXISTS public.profile_contact_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp','telegram')),
  viewer_id uuid,
  viewer_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_clicks_profile_created ON public.profile_contact_clicks(profile_id, created_at DESC);

ALTER TABLE public.profile_contact_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a click"
  ON public.profile_contact_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners and admins can read clicks"
  ON public.profile_contact_clicks FOR SELECT
  USING (auth.uid() = profile_id OR has_role(auth.uid(), 'admin'::app_role));
