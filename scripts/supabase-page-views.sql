-- 在 Supabase 專案 → SQL Editor 整段執行一次即可（免費方案可用）
-- 完成後在 config.js 填入 SUPABASE_URL、SUPABASE_ANON_KEY

create table if not exists public.page_views (
  id text primary key default 'main',
  visits bigint not null default 0
);

insert into public.page_views (id, visits) values ('main', 0)
on conflict (id) do nothing;

create or replace function public.increment_page_views()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare new_visits bigint;
begin
  update public.page_views
  set visits = visits + 1
  where id = 'main'
  returning visits into new_visits;
  return coalesce(new_visits, 0);
end;
$$;

alter table public.page_views enable row level security;

drop policy if exists "page_views_select_anon" on public.page_views;
create policy "page_views_select_anon"
  on public.page_views for select
  to anon, authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant select on public.page_views to anon, authenticated;
grant execute on function public.increment_page_views() to anon, authenticated;
