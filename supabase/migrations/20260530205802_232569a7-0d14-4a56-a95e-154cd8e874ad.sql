-- Tabla para contadores de rate limiting
CREATE TABLE public.rate_limits (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

GRANT ALL ON public.rate_limits TO service_role;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages rate limits"
ON public.rate_limits FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_rate_limits_window ON public.rate_limits (window_start);

-- Función: incrementa el contador y devuelve true si se permite la petición
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _key TEXT,
  _max_requests INTEGER,
  _window_seconds INTEGER
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, retry_after_seconds INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bucket TIMESTAMPTZ;
  _new_count INTEGER;
BEGIN
  -- Redondear ventana al inicio del bucket actual
  _bucket := to_timestamp(
    floor(extract(epoch FROM now()) / _window_seconds) * _window_seconds
  );

  INSERT INTO public.rate_limits (key, window_start, count)
  VALUES (_key, _bucket, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO _new_count;

  -- Limpiar buckets viejos ocasionalmente (10% probabilidad)
  IF random() < 0.1 THEN
    DELETE FROM public.rate_limits
    WHERE window_start < now() - interval '1 hour';
  END IF;

  RETURN QUERY SELECT
    (_new_count <= _max_requests),
    _new_count,
    CASE
      WHEN _new_count > _max_requests
      THEN _window_seconds - extract(epoch FROM (now() - _bucket))::INTEGER
      ELSE 0
    END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;