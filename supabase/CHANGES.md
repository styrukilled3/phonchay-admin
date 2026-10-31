# Lịch sử SQL Supabase

Mỗi bản có số thứ tự, gọi theo số: SQL-001, SQL-002... File nằm ở `supabase/sql/NNN_ten.sql`. Bản chứa mật khẩu thì không commit.

Mỗi bản SQL do Claude xuất, STY tự paste vào SQL Editor. Claude không tự chạy lên database.

| # | Ngày | Nội dung | Ảnh hưởng |
|---|---|---|---|
| 1 | 31/10/2026 | SQL-001 `sql/001_schema.sql`: bảng `app_docs`, RLS, hàm `save_doc`, `is_owner` | Tạo bảng và quyền. Áp lúc đầu qua kết nối, từ giờ chỉ paste tay |
| 2 | 31/10/2026 | SQL-002 (không commit): tạo tài khoản owner (email + mật khẩu tạm, `app_metadata.role = owner`) | Thêm 1 user. File chứa mật khẩu nên không commit |
