ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS image_is_ai boolean NOT NULL DEFAULT false;
