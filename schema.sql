-- BookForge Studio — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)

create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text default '',
  author text default '',
  subtitle text default '',
  raw_text text default '',
  chapters jsonb default '[]'::jsonb,
  characters jsonb default '[]'::jsonb,
  settings jsonb default '{}'::jsonb,
  cover jsonb default '{}'::jsonb,
  front_matter jsonb default '{}'::jsonb
);

alter table public.projects enable row level security;

drop policy if exists "public_access_all" on public.projects;
create policy "public_access_all" on public.projects for all using (true) with check (true);
