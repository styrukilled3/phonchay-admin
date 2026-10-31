# Lịch sử SQL Supabase

Mỗi bản có số thứ tự, gọi theo số: SQL-001, SQL-002... File nằm ở `supabase/sql/NNN_ten.sql`. Bản chứa mật khẩu thì không commit.

Mỗi bản SQL do Claude xuất, STY tự paste vào SQL Editor. Claude không tự chạy lên database.

| # | Ngày | Nội dung | Ảnh hưởng |
|---|---|---|---|
| 1 | 31/10/2026 | SQL-001 `sql/001_schema.sql`: bảng `app_docs`, RLS, hàm `save_doc`, `is_owner` | Tạo bảng và quyền. Áp lúc đầu qua kết nối, từ giờ chỉ paste tay |
| 2 | 31/10/2026 | SQL-002 (không commit): tạo tài khoản owner (email + mật khẩu tạm, `app_metadata.role = owner`) | Thêm 1 user. File chứa mật khẩu nên không commit |
| 3 | 31/10/2026 | SQL-003: SELECT chỉ đọc `app_docs` (key, rev, updated_at) | Không đổi gì, dùng để kiểm dữ liệu đã lên server chưa |
| 4 | 31/10/2026 | SQL-004 (không commit): tạo tài khoản nhân viên `styrukilled@gmail.com`, `app_metadata.role = staff`, mật khẩu tạm | Thêm 1 user staff. Đọc/ghi được `catalog`, `inventory`, `lines`, không đọc được dòng `owner` |
| 5 | 31/10/2026 | SQL-005 `sql/005_push.sql`: bảng `push_subs`, `push_config`, `push_sent` + RLS | Thêm 3 bảng cho thông báo đẩy. Cần chạy trước khi bật thông báo. Kèm Edge Function `notify-owner` (code ở `supabase/functions/notify-owner`, đã deploy) |
