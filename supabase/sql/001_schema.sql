-- PHONCHAY: dữ liệu đồng bộ. Dán cả file vào Supabase -> SQL Editor -> Run. Chạy lại nhiều lần không sao.
-- Mô hình: mỗi nhóm dữ liệu là một dòng (key) trong app_docs, ghi kèm số phiên bản (rev) để 2 máy
-- lưu cùng lúc không đè nhau âm thầm: ai ghi sau trên bản cũ sẽ bị báo conflict và tải lại.
--
-- key        ai đọc        ai ghi       nội dung
-- catalog    mọi người     mọi người    sản phẩm, giá bán (KHÔNG có giá vốn)
-- inventory  mọi người     mọi người    kho tổng, tồn kênh, yêu cầu lấy hàng
-- lines      mọi người     mọi người    số bán từng ngày từng kênh
-- rules      mọi người     owner        công thức giá kênh
-- locks      mọi người     owner        ngày đã chốt sổ
-- owner      owner         owner        giá vốn, phiếu nhập hàng

create table if not exists public.app_docs (
  key        text primary key,
  data       jsonb       not null default '{}'::jsonb,
  rev        bigint      not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid        default auth.uid()
);

alter table public.app_docs enable row level security;

-- Quyền lấy từ app_metadata trong JWT (người dùng không tự sửa được).
create or replace function public.is_owner() returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'owner'
$$;

drop policy if exists docs_read   on public.app_docs;
drop policy if exists docs_insert on public.app_docs;
drop policy if exists docs_update on public.app_docs;

create policy docs_read on public.app_docs for select to authenticated
  using (key <> 'owner' or public.is_owner());

create policy docs_insert on public.app_docs for insert to authenticated
  with check (public.is_owner() or key in ('catalog', 'inventory', 'lines'));

create policy docs_update on public.app_docs for update to authenticated
  using (public.is_owner() or key in ('catalog', 'inventory', 'lines'))
  with check (public.is_owner() or key in ('catalog', 'inventory', 'lines'));

-- Ghi có kiểm tra phiên bản. p_rev = 0 nghĩa là tạo mới. Trả về rev mới, hoặc báo conflict.
create or replace function public.save_doc(p_key text, p_data jsonb, p_rev bigint)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare new_rev bigint;
begin
  if p_rev = 0 then
    insert into public.app_docs(key, data, rev) values (p_key, p_data, 1)
    on conflict (key) do nothing
    returning rev into new_rev;
  else
    update public.app_docs
       set data = p_data, rev = rev + 1, updated_at = now(), updated_by = auth.uid()
     where key = p_key and rev = p_rev
    returning rev into new_rev;
  end if;
  if new_rev is null then
    raise exception 'conflict' using errcode = 'P0001';
  end if;
  return new_rev;
end $$;

revoke execute on function public.save_doc(text, jsonb, bigint) from public, anon;
grant execute on function public.save_doc(text, jsonb, bigint) to authenticated;
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- Gán quyền owner. Sau khi chạy, đăng xuất rồi đăng nhập lại để token mang quyền mới.
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"owner"}'::jsonb
 where email = 'styrukilled3@gmail.com';

-- Kiểm tra: phải thấy 1 dòng owner.
select email, raw_app_meta_data ->> 'role' as role from auth.users order by created_at;
