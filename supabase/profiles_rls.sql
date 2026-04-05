-- Supabase SQL editor で実行する想定
-- profiles テーブルに RLS を設定し、認証ユーザーが自分のプロフィールのみ参照/更新できるようにする

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
