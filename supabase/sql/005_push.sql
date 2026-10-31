-- SQL-005: thông báo đẩy cho owner khi nhân viên gửi yêu cầu lấy hàng.
-- push_subs   thiết bị đã bật thông báo (mỗi người chỉ thấy/sửa dòng của mình; role lấy từ JWT lúc đăng ký)
-- push_config khóa VAPID do Edge Function tự sinh, không ai đọc được ngoài Edge Function
-- push_sent   đã gửi thông báo cho yêu cầu nào, để không gửi trùng

create table if not exists public.push_subs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid(),
  role       text not null default coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'staff'),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;

drop policy if exists push_subs_select on public.push_subs;
drop policy if exists push_subs_insert on public.push_subs;
drop policy if exists push_subs_update on public.push_subs;
drop policy if exists push_subs_delete on public.push_subs;
create policy push_subs_select on public.push_subs for select to authenticated using (user_id = auth.uid());
create policy push_subs_insert on public.push_subs for insert to authenticated with check (user_id = auth.uid());
create policy push_subs_update on public.push_subs for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_subs_delete on public.push_subs for delete to authenticated using (user_id = auth.uid());

create table if not exists public.push_config (
  id          int primary key check (id = 1),
  public_key  text not null,
  private_key text not null
);
alter table public.push_config enable row level security;
revoke all on public.push_config from anon, authenticated;

create table if not exists public.push_sent (
  request_id text primary key,
  sent_at    timestamptz not null default now()
);
alter table public.push_sent enable row level security;
revoke all on public.push_sent from anon, authenticated;

select table_name from information_schema.tables where table_schema = 'public' and table_name like 'push_%' order by 1;
