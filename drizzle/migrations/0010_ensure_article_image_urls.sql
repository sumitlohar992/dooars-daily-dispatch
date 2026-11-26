ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

UPDATE public.articles
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND cardinality(image_urls) = 0;

NOTIFY pgrst, 'reload schema';
