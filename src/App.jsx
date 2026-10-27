import { useState } from 'react'
import { formatDate, formatVND } from './lib/format.js'
import './App.css'

const SWATCHES = [
  ['--bg', 'Nền trang'],
  ['--surface', 'Card, bảng'],
  ['--surface-2', 'Hover, hàng xen kẽ'],
  ['--border', 'Đường kẻ'],
  ['--border-strong', 'Viền control'],
  ['--ink', 'Chữ chính'],
  ['--ink-muted', 'Chữ phụ'],
  ['--accent', 'Nút chính'],
  ['--success', 'Đã chốt, đạt'],
  ['--warning', 'Cờ cảnh báo'],
  ['--danger', 'Lỗi, xóa'],
]

const CHANNELS = [
  { code: 'SP', name: 'Shopee', color: 'var(--ch-1)' },
  { code: 'TT', name: 'TikTok Shop', color: 'var(--ch-2)' },
  { code: 'WEB', name: 'Website', color: 'var(--ch-3)' },
  { code: 'STORE', name: 'Cửa hàng', color: 'var(--ch-4)' },
  { code: 'ZL', name: 'Inbox / Zalo', color: 'var(--ch-5)' },
]

const SAMPLE_ROWS = [
  { sku: 'PC-TEE-PHO-BLK-M', name: 'Áo thun Phở / Đen / M', qty: 12, price: 289000 },
  { sku: 'PC-TEE-PHO-BLK-L', name: 'Áo thun Phở / Đen / L', qty: 8, price: 289000 },
  { sku: 'PC-HOO-ƯƠM-CRM-XL', name: 'Hoodie Ươm / Kem / XL', qty: 3, price: 559000 },
]

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.5v4M8 10.8v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export default function App() {
  const [qty, setQty] = useState('')
  const invalid = qty !== '' && !/^\d+$/.test(qty)

  return (
    <main className="page">
      <header className="page-head reveal" style={{ '--i': 0 }}>
        <p className="eyebrow">PHONCHAY Admin</p>
        <h1>Nền thiết kế</h1>
        <p className="lede">
          Trang kiểm tra token, chữ tiếng Việt và các trạng thái control trước khi dựng màn nhập
          liệu. Hôm nay: {formatDate(new Date())}.
        </p>
      </header>

      <section className="block reveal" style={{ '--i': 1 }}>
        <h2>Màu</h2>
        <ul className="swatches">
          {SWATCHES.map(([token, label]) => (
            <li key={token}>
              <span className="swatch" style={{ background: `var(${token})` }} />
              <code>{token}</code>
              <span className="muted">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="block reveal" style={{ '--i': 2 }}>
        <h2>5 kênh bán</h2>
        <div className="row">
          {CHANNELS.map((c) => (
            <span key={c.code} className="chip chip-channel" style={{ '--chip-color': c.color }}>
              <span className="dot" />
              <span className="chip-code">{c.code}</span>
              {c.name}
            </span>
          ))}
        </div>
        <p className="type-meta">Màu kênh luôn đi kèm mã chữ, không dùng màu làm tín hiệu duy nhất.</p>
      </section>

      <section className="block reveal" style={{ '--i': 3 }}>
        <h2>Chữ</h2>
        <div className="card type-sample">
          <p className="type-kpi">{formatVND(48215000)}</p>
          <p className="type-h">Nguyễn Thị Tuyết xuất sắc, ngược ngạo trưởng thành</p>
          <p>
            Áo thun Phở đen size M, hoodie Ươm màu kem. Thân chữ Be Vietnam Pro kiểm tra các dấu
            ệ, ữ, ắ, ỡ, ặ, ự ở cỡ 16px.
          </p>
          <p className="type-meta">Chú thích 14px: cập nhật lần cuối {formatDate('2026-10-27')}.</p>
        </div>
      </section>

      <section className="block reveal" style={{ '--i': 4 }}>
        <h2>Bảng dòng bán</h2>
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Sản phẩm</th>
                <th className="num">SL</th>
                <th className="num">Giá</th>
                <th className="num">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_ROWS.map((r) => (
                <tr key={r.sku}>
                  <td>
                    <code>{r.sku}</code>
                  </td>
                  <td>{r.name}</td>
                  <td className="num">{r.qty}</td>
                  <td className="num">{formatVND(r.price)}</td>
                  <td className="num">{formatVND(r.qty * r.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="block reveal" style={{ '--i': 5 }}>
        <h2>Control và trạng thái</h2>
        <div className="card block">
          <div className="row">
            <button className="btn btn-primary">Gửi ngày</button>
            <button className="btn btn-secondary">Lưu nháp</button>
            <button className="btn btn-danger">Xóa dòng</button>
            <button className="btn btn-primary" disabled>
              Đang khóa
            </button>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="qty">Số lượng</label>
              <input
                id="qty"
                className="input num"
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                aria-invalid={invalid}
                aria-describedby={invalid ? 'qty-err' : undefined}
              />
              {invalid && (
                <p id="qty-err" className="field-error">
                  <AlertIcon />
                  Số lượng phải là số nguyên không âm
                </p>
              )}
            </div>
            <div className="field">
              <label htmlFor="note">Ghi chú</label>
              <input id="note" className="input" />
            </div>
          </div>
          <div className="row">
            <span className="chip chip-draft">Nháp</span>
            <span className="chip chip-sent">Đã gửi</span>
            <span className="chip chip-locked">
              <LockIcon />
              Đã chốt
            </span>
          </div>
          <p className="type-meta">Gõ chữ vào ô Số lượng để xem trạng thái lỗi.</p>
        </div>
      </section>
    </main>
  )
}
