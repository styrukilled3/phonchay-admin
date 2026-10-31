# PHONCHAY Admin

App nội bộ của PHONCHAY: nhân viên nhập doanh số hằng ngày theo 5 kênh bán, owner xem tổng doanh thu và tách từng kênh (gross, net, margin).

Stack: React + Vite (demo dữ liệu mẫu), sau đó nối Supabase (Auth, Postgres, RLS).

Spec thiết kế: xem doc "PHONCHAY Admin - Spec thiết kế" trong project PHON CHAY trên claude.ai.

## Chạy local

```bash
npm install
npm run dev
```

## Đăng nhập

Màn đăng nhập ở `src/screens/Login.jsx`, logic ở `src/lib/auth.js` (gọi API Auth của Supabase bằng `fetch`, không cần thêm thư viện).

- **Chưa nối Supabase (mặc định):** chế độ thử. Ai cũng vào được (mật khẩu từ 6 ký tự), email bắt đầu bằng `owner` thì vào quyền owner. Không phải bảo mật thật, màn đăng nhập có ghi rõ.
- **Nối Supabase:** sao chép `.env.example` thành `.env.local`, điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`. Quyền lấy từ `app_metadata.role` của user (`owner`, còn lại là nhân viên). Đặt trong Supabase: Authentication -> Users -> sửa Raw App Meta Data thành `{"role":"owner"}`.
- Đăng nhập đúng là vào Dashboard (owner) hoặc Kênh bán (nhân viên). Quên mật khẩu gửi link qua email, link quay về app ở màn đặt mật khẩu mới. Trong Supabase cần thêm URL của app vào Authentication -> URL Configuration -> Redirect URLs.
- Dữ liệu bán hàng vẫn lưu trong trình duyệt (`src/lib/persist.js`), chưa đồng bộ qua Supabase. Đó là bước kế tiếp.
