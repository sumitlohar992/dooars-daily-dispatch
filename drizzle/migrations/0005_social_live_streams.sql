CREATE TABLE public.social_live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('youtube', 'facebook')),
  stream_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX social_live_streams_created_at_idx ON public.social_live_streams (created_at DESC);

GRANT SELECT ON public.social_live_streams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_live_streams TO authenticated;
GRANT ALL ON public.social_live_streams TO service_role;

ALTER TABLE public.social_live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social live streams readable"
  ON public.social_live_streams FOR SELECT USING (true);
CREATE POLICY "own social live stream insert"
  ON public.social_live_streams FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own social live stream update"
  ON public.social_live_streams FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own social live stream delete"
  ON public.social_live_streams FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
