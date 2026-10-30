-- KiberPankas — Supabase schema
-- Supabase → SQL Editor → įklijuok viską → Run.
-- Po to: Authentication → Providers → Email (įjungta).
-- Save sau GM rolę: update public.profiles set role = 'gm' where callsign = 'TAVO_ŠAUKINYS';

-- ---------- profiliai ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  callsign   text unique,
  role       text not null default 'player' check (role in ('player', 'gm')),
  created_at timestamptz not null default now()
);

-- automatiškai sukuria profilį registruojantis
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, callsign)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'callsign', ''), split_part(new.email, '@', 1)));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_gm() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'gm');
$$;

-- ---------- veikėjai ----------
create table if not exists public.characters (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references public.profiles on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists characters_owner_idx on public.characters (owner);

-- ---------- užsakymai iš parduotuvės ----------
create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references public.profiles on delete cascade,
  item       jsonb not null,
  status     text not null default 'laukia' check (status in ('laukia', 'patvirtinta', 'atmesta')),
  created_at timestamptz not null default now()
);

-- ---------- prieigos taisyklės (RLS) ----------
alter table public.profiles   enable row level security;
alter table public.characters enable row level security;
alter table public.orders     enable row level security;

drop policy if exists "profiliai: savo arba gm" on public.profiles;
create policy "profiliai: savo arba gm" on public.profiles
  for select using (id = auth.uid() or public.is_gm());

drop policy if exists "veikėjai: savo arba gm" on public.characters;
create policy "veikėjai: savo arba gm" on public.characters
  for all using (owner = auth.uid() or public.is_gm())
  with check (owner = auth.uid() or public.is_gm());

drop policy if exists "užsakymai: matyti savo arba gm" on public.orders;
create policy "užsakymai: matyti savo arba gm" on public.orders
  for select using (owner = auth.uid() or public.is_gm());

drop policy if exists "užsakymai: kurti savo" on public.orders;
create policy "užsakymai: kurti savo" on public.orders
  for insert with check (owner = auth.uid() and status = 'laukia');

drop policy if exists "užsakymai: keisti tik gm" on public.orders;
create policy "užsakymai: keisti tik gm" on public.orders
  for update using (public.is_gm());
