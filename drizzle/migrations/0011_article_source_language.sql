ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS source_language text
  CHECK (source_language IN ('en', 'bn', 'hi'));

NOTIFY pgrst, 'reload schema';
