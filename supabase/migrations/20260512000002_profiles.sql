-- 20260512000002_profiles.sql
-- Per-user profile, auto-created on auth.users insert.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  units_weight weight_unit not null default 'kg',
  units_distance distance_unit not null default 'km',
  default_bodyweight numeric,
  available_equipment equipment_type[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on profiles
  for each row execute function public.touch_updated_at();
