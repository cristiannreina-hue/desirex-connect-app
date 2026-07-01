
-- Restaurar GRANTs a los roles del API (RLS sigue controlando el acceso real)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Lectura pública (anon) para tablas con políticas que permiten lectura pública
GRANT SELECT ON public.profiles          TO anon, authenticated;
GRANT SELECT ON public.reviews           TO anon, authenticated;
GRANT SELECT ON public.site_settings     TO anon, authenticated;
GRANT SELECT ON public.subscriptions     TO anon, authenticated;

-- Tablas de usuario autenticado
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE          ON public.subscriptions        TO authenticated;
GRANT SELECT, INSERT                  ON public.payments             TO authenticated;
GRANT SELECT, INSERT                  ON public.profile_views        TO anon, authenticated;
GRANT SELECT, INSERT                  ON public.profile_contact_clicks TO anon, authenticated;
GRANT SELECT, INSERT                  ON public.site_visits          TO anon, authenticated;
GRANT SELECT                          ON public.user_roles           TO authenticated;
GRANT SELECT                          ON public.weekly_rewards       TO authenticated;
GRANT INSERT                          ON public.leads_lanzamiento    TO anon, authenticated;
GRANT INSERT                          ON public.email_unsubscribe_tokens TO anon;

-- Defaults para nuevas tablas creadas más adelante
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
