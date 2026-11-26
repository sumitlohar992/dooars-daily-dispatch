create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

insert into public.user_roles (user_id, role) values ('d5a577e2-e394-47ac-a826-cc02f1b37e7a','admin');

create table public.user_details (
  user_id uuid primary key,
  full_name text,
  phone text,
  address text,
  city text,
  pincode text,
  photo_url text,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.user_details to authenticated;
grant all on public.user_details to service_role;
alter table public.user_details enable row level security;
create policy "own details select" on public.user_details for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "own details insert" on public.user_details for insert to authenticated with check (auth.uid() = user_id);
create policy "own details update" on public.user_details for update to authenticated using (auth.uid() = user_id);

alter table public.articles add column source_url text unique, add column source_name text;
create policy "admin update any" on public.articles for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete any" on public.articles for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete comments" on public.comments for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.admin_stats()
returns json language plpgsql stable security definer set search_path = public as $$
declare r json;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  select json_build_object(
    'total_users', (select count(*) from auth.users),
    'active_today', (select count(*) from public.user_details where last_seen_at > now() - interval '1 day'),
    'active_week', (select count(*) from public.user_details where last_seen_at > now() - interval '7 days'),
    'new_week', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'articles', (select count(*) from public.articles),
    'google_articles', (select count(*) from public.articles where source_url is not null),
    'comments', (select count(*) from public.comments),
    'users', (select coalesce(json_agg(u order by u.created_at desc),'[]'::json) from (
      select au.id, au.email, au.created_at, d.full_name, d.phone, d.city, d.last_seen_at
      from auth.users au left join public.user_details d on d.user_id = au.id limit 200) u)
  ) into r;
  return r;
end $$;
revoke execute on function public.admin_stats() from anon, public;
grant execute on function public.admin_stats() to authenticated;
