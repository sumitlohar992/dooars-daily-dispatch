CREATE OR REPLACE FUNCTION public.record_view(_article_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.articles
  SET views = views + 1
  WHERE id = _article_id
    AND author_id IS DISTINCT FROM auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.record_view(uuid) TO anon, authenticated;
