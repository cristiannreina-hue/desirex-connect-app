-- Quitar la política permisiva
DROP POLICY IF EXISTS "Anyone can view subscriptions" ON public.subscriptions;

-- Solo el dueño y los admins pueden leer
CREATE POLICY "Users view own subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Vista pública con info mínima necesaria para resaltar/ordenar creadoras activas.
-- No expone más que lo que ya es público en el perfil (id del creador) + plan/estado/expiración.
CREATE OR REPLACE VIEW public.creator_subscriptions_public
WITH (security_invoker = on) AS
SELECT s.user_id, s.tier, s.status, s.expires_at
FROM public.subscriptions s
JOIN public.profiles p ON p.id = s.user_id
WHERE p.account_type = 'creator'
  AND p.is_public_visible = true
  AND s.status IN ('trial','active')
  AND s.expires_at > now();

-- La vista necesita una política que permita leer; al ser security_invoker,
-- aplica las políticas del usuario. Damos un GRANT explícito y una política SELECT
-- adicional para los roles públicos sobre las filas que cumplen el filtro de la vista.
GRANT SELECT ON public.creator_subscriptions_public TO anon, authenticated;

-- Para que la vista funcione con anon/authenticated, necesitamos una política
-- que permita leer suscripciones activas de creadoras públicas.
CREATE POLICY "Public can read active creator subscriptions"
ON public.subscriptions FOR SELECT
TO anon, authenticated
USING (
  status IN ('trial','active')
  AND expires_at > now()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = subscriptions.user_id
      AND p.account_type = 'creator'
      AND p.is_public_visible = true
  )
);