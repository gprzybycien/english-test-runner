create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  test_id text not null,
  test_title text not null,
  score_earned numeric not null,
  score_possible numeric not null,
  percent integer not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists test_attempts_user_created_idx
  on public.test_attempts (user_id, created_at desc);

alter table public.test_attempts enable row level security;

drop policy if exists test_attempts_select_own on public.test_attempts;
create policy test_attempts_select_own on public.test_attempts
  for select to authenticated
  using (user_id = auth.user_id());

drop policy if exists test_attempts_insert_own on public.test_attempts;
create policy test_attempts_insert_own on public.test_attempts
  for insert to authenticated
  with check (user_id = auth.user_id());

grant select, insert on public.test_attempts to authenticated;
