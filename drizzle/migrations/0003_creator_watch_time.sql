ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS media_watch_seconds integer NOT NULL DEFAULT 0;

CREATE TABLE public.media_watch_sessions (
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, viewer_id)
);
ALTER TABLE public.media_watch_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.media_watch_sessions FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_media_watch(_article_id uuid, _active boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _viewer_id uuid := auth.uid();
  _last_seen_at timestamptz;
  _elapsed integer;
BEGIN
  IF _viewer_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.articles
    WHERE id = _article_id
      AND author_id IS NOT NULL
      AND (image_url IS NOT NULL OR video_url IS NOT NULL)
      AND author_id <> _viewer_id
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.media_watch_sessions (article_id, viewer_id)
  VALUES (_article_id, _viewer_id)
  ON CONFLICT (article_id, viewer_id) DO NOTHING;

  SELECT last_seen_at INTO _last_seen_at
  FROM public.media_watch_sessions
  WHERE article_id = _article_id AND viewer_id = _viewer_id
  FOR UPDATE;

  _elapsed := LEAST(30, GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - _last_seen_at)))::integer));
  UPDATE public.media_watch_sessions
  SET last_seen_at = now()
  WHERE article_id = _article_id AND viewer_id = _viewer_id;

  IF _active AND _elapsed > 0 THEN
    UPDATE public.articles
    SET media_watch_seconds = media_watch_seconds + _elapsed
    WHERE id = _article_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_media_watch(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_media_watch(uuid, boolean) TO authenticated;
