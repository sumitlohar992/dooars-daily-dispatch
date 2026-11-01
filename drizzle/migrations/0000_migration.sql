create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable" on public.profiles for select using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid,
  author_name text not null default 'Dooars Khabar Desk',
  title text not null,
  category text not null default 'Local',
  summary text,
  body text not null default '',
  image_url text,
  video_url text,
  is_breaking boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated;
grant all on public.articles to service_role;
alter table public.articles enable row level security;
create policy "articles readable" on public.articles for select using (true);
create policy "authors insert" on public.articles for insert to authenticated with check (auth.uid() = author_id);
create policy "authors update" on public.articles for update to authenticated using (auth.uid() = author_id);
create policy "authors delete" on public.articles for delete to authenticated using (auth.uid() = author_id);
create index on public.articles (created_at desc);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null,
  user_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);
grant select on public.comments to anon;
grant select, insert, delete on public.comments to authenticated;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
create policy "comments readable" on public.comments for select using (true);
create policy "own comment insert" on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "own comment delete" on public.comments for delete to authenticated using (auth.uid() = user_id);

create table public.reactions (
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);
grant select on public.reactions to anon;
grant select, insert, delete on public.reactions to authenticated;
grant all on public.reactions to service_role;
alter table public.reactions enable row level security;
create policy "reactions readable" on public.reactions for select using (true);
create policy "own reaction insert" on public.reactions for insert to authenticated with check (auth.uid() = user_id);
create policy "own reaction delete" on public.reactions for delete to authenticated using (auth.uid() = user_id);

create table public.bookmarks (
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);
grant select, insert, delete on public.bookmarks to authenticated;
grant all on public.bookmarks to service_role;
alter table public.bookmarks enable row level security;
create policy "own bookmarks select" on public.bookmarks for select to authenticated using (auth.uid() = user_id);
create policy "own bookmarks insert" on public.bookmarks for insert to authenticated with check (auth.uid() = user_id);
create policy "own bookmarks delete" on public.bookmarks for delete to authenticated using (auth.uid() = user_id);

create policy "media public read" on storage.objects for select using (bucket_id = 'media');
create policy "media auth upload" on storage.objects for insert to authenticated with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

insert into public.articles (title, category, summary, body, image_url, is_breaking, author_name, created_at) values
('Heavy rain alert for Jalpaiguri and Alipurduar districts', 'Local', 'The weather office has issued an orange alert as monsoon clouds gather over the Dooars.', E'The regional weather office has issued an orange alert for Jalpaiguri and Alipurduar districts for the next 48 hours.\n\nResidents near the Teesta and Torsa rivers are advised to stay alert. District administrations have opened control rooms and relief shelters are being prepared in low-lying areas.\n\nTea garden workers have been asked to avoid slopes prone to landslides.', 'https://images.unsplash.com/photo-1501691223387-dd0500403074?w=1200', true, 'Ritu Barman', now() - interval '20 minutes'),
('Tea gardens of Dooars see record first-flush harvest', 'West Bengal', 'Planters report the best first-flush quality in a decade.', E'Tea estates across the Dooars belt have reported a record first-flush harvest this season.\n\nPlanters credit timely rainfall and improved pruning techniques. Auction prices in Siliguri have jumped by nearly 15 percent compared with last year.', 'https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?w=1200', true, 'Amit Roy', now() - interval '2 hours'),
('Gorumara National Park reopens for tourists', 'Local', 'Safari bookings open from Monday after the annual closure.', E'Gorumara National Park will reopen for tourists from Monday after its annual monsoon closure.\n\nForest officials say rhino and elephant sightings have increased. Online safari bookings are now open.', 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=1200', false, 'Dooars Khabar Desk', now() - interval '5 hours'),
('Parliament session to begin next week with key bills', 'National', 'Several important bills are expected to be tabled.', E'The winter session of Parliament begins next week. The government is expected to table several bills on infrastructure and digital services.\n\nOpposition parties have met to plan a joint strategy.', 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200', true, 'Neha Sharma', now() - interval '8 hours'),
('State assembly debate heats up over rural roads', 'Politics', 'Ruling and opposition members clash over road funds for North Bengal.', E'The state assembly witnessed heated debate on Thursday over the allocation of rural road funds for North Bengal districts.\n\nMembers from the Dooars region demanded faster work on village connectivity.', 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200', false, 'Sanjay Das', now() - interval '12 hours'),
('Siliguri club lifts North Bengal football cup', 'Sports', 'A late goal sealed a thrilling 2-1 win in the final.', E'Siliguri Young Stars won the North Bengal football cup with a dramatic 2-1 win in the final at Kanchenjunga Stadium.\n\nThousands of fans filled the stands for the evening match.', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200', false, 'Rahul Oraon', now() - interval '1 day'),
('Local film shot in Dooars wins festival award', 'Entertainment', 'The Rajbanshi-language film impressed jury members.', E'A feature film shot entirely in the Dooars has won the best regional film award at a national film festival.\n\nThe director thanked the people of Malbazar for their support during the shoot.', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200', false, 'Priya Sen', now() - interval '1 day 4 hours'),
('New bridge over Torsa river to open next month', 'West Bengal', 'The bridge will cut travel time between Alipurduar and Cooch Behar.', E'The new bridge over the Torsa river is almost complete and is set to open next month.\n\nCommuters expect travel time to fall by nearly an hour.', 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1200', false, 'Dooars Khabar Desk', now() - interval '2 days');
