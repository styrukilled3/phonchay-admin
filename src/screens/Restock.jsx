import { useMemo, useState } from 'react'
import { CHANNELS, PRODUCTS, product } from '../data/seed.js'
import { compact, deaccent, dmy, money } from '../lib/format.js'
import { skuUnits, stockStats, stockStatus } from '../lib/stock.js'
import { NumInput, TrashIcon } from '../components/bits.jsx'
import CountUp from '../components/CountUp.jsx'
import Reveal from '../components/Reveal.jsx'

const SUGGEST_QTY = 30

function Badge({ status }) {
  if (status === 'out') return <span className="stk-badge is-out">Hết hàng</span>
  if (status === 'low') return <span className="stk-badge is-low">Sắp hết</span>
  return null
}

export default function Restock({ stock, receipts, today, onBack, onNewProduct, onConfirm, toast }) {
  // Mở sẵn các SKU sắp hết / hết để nhập nhanh
  const [rows, setRows] = useState(() =>
    PRODUCTS.filter((p) => stockStatus(stock, p) !== 'ok').map((p) => ({
      sku: p.sku,
      qty: SUGGEST_QTY,
      cost: p.cost,
    })),
  )
  const [date, setDate] = useState(today)
  const [supplier, setSupplier] = useState('')
  const [note, setNote] = useState('')
  const [target, setTarget] = useState(CHANNELS[0].id)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const stats = stockStats(stock)
  const totalQty = rows.reduce((s, r) => s + r.qty, 0)
  const totalCost = rows.reduce((s, r) => s + r.qty * r.cost, 0)

  const matches = useMemo(() => {
    const k = deaccent(q.trim())
    return PRODUCTS.filter((p) => !rows.some((r) => r.sku === p.sku))
      .filter((p) => !k || deaccent(`${p.sku} ${p.name} ${p.variant}`).includes(k))
      .slice(0, 6)
  }, [q, rows])

  function add(p) {
    setRows((r) => [...r, { sku: p.sku, qty: 1, cost: p.cost }])
    setQ('')
    setOpen(false)
  }

  function patch(sku, next) {
    setRows((r) => r.map((x) => (x.sku === sku ? { ...x, ...next } : x)))
  }

  const canSave = rows.length > 0 && rows.every((r) => r.qty > 0)

  return (
    <>
      <div className="ch-bar">
        <button type="button" className="back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13 8H4M7.5 4.5L4 8l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tất cả kênh
        </button>
      </div>

      <Reveal className="rs-kpis">
        <div className="kpi">
          <span className="lbl">Tổng tồn</span>
          <span className="val"><CountUp value={stats.units} format={(n) => Math.round(n).toLocaleString('vi-VN')} /> sp</span>
        </div>
        <div className="kpi">
          <span className="lbl">Sắp hết</span>
          <span className="val is-low"><CountUp value={stats.low} /> SKU</span>
        </div>
        <div className="kpi">
          <span className="lbl">Hết hàng</span>
          <span className="val is-out"><CountUp value={stats.out} /> SKU</span>
        </div>
      </Reveal>

      <Reveal as="section" className="card rs-form">
        <header>
          <h2>Phiếu nhập hàng</h2>
          <span className="hint">Nhập xong bấm xác nhận để cộng vào tồn kho.</span>
        </header>
        <div className="rs-grid">
          <div className="field">
            <label htmlFor="rs-date">Ngày nhập</label>
            <input id="rs-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rs-sup">Nhà cung cấp</label>
            <input id="rs-sup" className="input" placeholder="Xưởng may, nhà in..." value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rs-ch">Nhập vào kênh</label>
            <select id="rs-ch" className="input" value={target} onChange={(e) => setTarget(e.target.value)}>
              {CHANNELS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rs-note">Ghi chú</label>
            <input id="rs-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="card rs-lines">
        <header>
          <h2>Sản phẩm nhập</h2>
          <button type="button" className="link-btn" onClick={onNewProduct}>+ Tạo sản phẩm mới</button>
        </header>

        <div className="rs-find">
          <input
            className="input"
            placeholder="Tìm SKU hoặc tên sản phẩm để thêm"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            aria-label="Tìm sản phẩm để thêm vào phiếu"
          />
          {open && matches.length > 0 && (
            <ul className="rs-drop">
              {matches.map((p) => (
                <li key={p.sku}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(p)}>
                    <b>{p.name}</b> <span>{p.variant}</span>
                    <small>{p.sku}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {rows.length === 0 && <p className="hint">Chưa có dòng nào. Tìm sản phẩm ở trên để thêm.</p>}

        <div className="rs-rows">
          {rows.map((r) => {
            const p = product(r.sku)
            return (
              <div className="rs-row" key={r.sku}>
                <div className="rs-name">
                  <b>{p.name}</b>
                  <span>{p.variant} · {p.sku}</span>
                  <Badge status={stockStatus(stock, p)} />
                </div>
                <div className="rs-cell">
                  <span className="k">Tồn hiện tại</span>
                  <span className="v">{skuUnits(stock, p.sku)}</span>
                </div>
                <div className="rs-cell">
                  <span className="k">SL nhập</span>
                  <div className="stepper">
                    <button type="button" aria-label="Giảm" disabled={r.qty <= 1} onClick={() => patch(r.sku, { qty: r.qty - 1 })}>−</button>
                    <NumInput value={r.qty} onCommit={(n) => patch(r.sku, { qty: Math.max(1, n) })} aria-label={`Số lượng nhập ${p.name} ${p.variant}`} />
                    <button type="button" aria-label="Tăng" onClick={() => patch(r.sku, { qty: r.qty + 1 })}>+</button>
                  </div>
                </div>
                <div className="rs-cell">
                  <span className="k">Giá vốn nhập</span>
                  <NumInput className="input rs-cost" value={r.cost} onCommit={(n) => patch(r.sku, { cost: n })} aria-label={`Giá vốn ${p.name} ${p.variant}`} />
                </div>
                <div className="rs-cell">
                  <span className="k">Thành tiền</span>
                  <span className="v">{money(r.qty * r.cost)}</span>
                </div>
                <button type="button" className="icon-btn" aria-label={`Bỏ ${p.name} ${p.variant}`} onClick={() => setRows((x) => x.filter((y) => y.sku !== r.sku))}>
                  <TrashIcon />
                </button>
              </div>
            )
          })}
        </div>

        <div className="rs-total">
          <div><span className="k">Số dòng SKU</span><span className="v">{rows.length}</span></div>
          <div><span className="k">Tổng SL nhập</span><span className="v">{totalQty}</span></div>
          <div><span className="k">Tổng tiền nhập</span><span className="v">{compact(totalCost)}</span></div>
          <div><span className="k">Tồn sau nhập</span><span className="v">{stats.units + totalQty}</span></div>
        </div>

        <div className="actions rs-actions">
          <button type="button" className="btn btn-secondary" onClick={() => toast('Đã lưu nháp phiếu nhập.')}>Lưu nháp</button>
          <button
            type="button"
            className="btn"
            disabled={!canSave}
            onClick={() => onConfirm({ rows, date, supplier, note, target, totalQty, totalCost })}
          >
            Xác nhận nhập kho
          </button>
        </div>
      </Reveal>

      <Reveal as="section" className="card">
        <header>
          <h2>Phiếu nhập gần đây</h2>
        </header>
        <ul className="rs-hist">
          {receipts.map((r) => (
            <li key={r.id}>
              <b>{r.id}</b>
              <span>{dmy(r.date)}</span>
              <span>+{r.qty} sp</span>
              <span>{compact(r.total)}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </>
  )
}
