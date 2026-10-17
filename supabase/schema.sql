-- Run this once in the Supabase SQL editor.

create table if not exists public.entries (
  id uuid primary key,
  number integer generated always as identity unique,
  created_at timestamptz not null default now(),
  entry jsonb not null
);

-- The app talks to Supabase from the server with the service role key, so no public policies are needed.
alter table public.entries enable row level security;

-- Public bucket so entry images can be shown by URL.
insert into storage.buckets (id, name, public)
values ('fakemon-images', 'fakemon-images', true)
on conflict (id) do nothing;
