-- Singleton settings table
CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message text,
  launch_date timestamptz,
  signups_open boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert site settings"
ON public.site_settings FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update site settings"
ON public.site_settings FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed the singleton row
INSERT INTO public.site_settings (id) VALUES (true) ON CONFLICT DO NOTHING;