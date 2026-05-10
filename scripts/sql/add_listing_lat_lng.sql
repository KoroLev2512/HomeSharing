-- Выполните в SQL Editor Supabase (или через миграцию), если колонок ещё нет.
alter table public.listings
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

comment on column public.listings.latitude is 'Широта точки на карте (WGS84), необязательно';
comment on column public.listings.longitude is 'Долгота точки на карте (WGS84), необязательно';
