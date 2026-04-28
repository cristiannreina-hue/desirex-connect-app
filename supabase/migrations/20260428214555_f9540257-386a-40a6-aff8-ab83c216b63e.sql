-- Asegurar replica identity completa para postgres_changes
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Añadir profiles a la publicación de realtime (si no estaba)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';
  END IF;
END $$;