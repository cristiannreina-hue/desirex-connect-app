CREATE TABLE public.leads_lanzamiento (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact text NOT NULL,
  contact_type text NOT NULL CHECK (contact_type IN ('email','whatsapp')),
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads_lanzamiento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a launch lead"
  ON public.leads_lanzamiento FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read launch leads"
  ON public.leads_lanzamiento FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_leads_lanzamiento_created_at ON public.leads_lanzamiento (created_at DESC);