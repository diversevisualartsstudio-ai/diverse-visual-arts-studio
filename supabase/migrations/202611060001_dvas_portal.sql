-- DVAS portal schema. Run this migration in the Supabase SQL editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'client' check (role in ('client', 'investor', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null check (char_length(client_name) between 1 and 120),
  project_type text not null check (char_length(project_type) <= 120),
  budget text not null check (char_length(budget) <= 40),
  timeline text not null check (char_length(timeline) <= 80),
  scope text not null default '' check (char_length(scope) <= 3000),
  status text not null default 'submitted' check (status in ('submitted', 'review', 'in_progress', 'complete', 'rejected')),
  created_at timestamptz not null default now()
);

create or replace function public.create_dvas_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)), 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_dvas on auth.users;
create trigger on_auth_user_created_dvas after insert on auth.users
for each row execute procedure public.create_dvas_profile();

create or replace function public.dvas_current_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;

revoke all on function public.dvas_current_role() from public;
grant execute on function public.dvas_current_role() to authenticated;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;

drop policy if exists "Users read own profile or admins read all" on public.profiles;
create policy "Users read own profile or admins read all" on public.profiles
for select to authenticated using (id = (select auth.uid()) or (select public.dvas_current_role()) = 'admin');

drop policy if exists "Clients and admins read projects" on public.projects;
create policy "Clients and admins read projects" on public.projects
for select to authenticated using (
  owner_id = (select auth.uid()) or (select public.dvas_current_role()) in ('admin', 'investor')
);

drop policy if exists "Clients and admins submit projects" on public.projects;
create policy "Clients and admins submit projects" on public.projects
for insert to authenticated with check (
  owner_id = (select auth.uid()) and (select public.dvas_current_role()) in ('client', 'admin')
);

drop policy if exists "Admins update projects" on public.projects;
create policy "Admins update projects" on public.projects
for update to authenticated using ((select public.dvas_current_role()) = 'admin')
with check ((select public.dvas_current_role()) = 'admin');

grant select on public.profiles to authenticated;
grant select, insert, update on public.projects to authenticated;

-- Bootstrap the first administrator only after signing up, using the trusted SQL editor:
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR_ADMIN_EMAIL');
