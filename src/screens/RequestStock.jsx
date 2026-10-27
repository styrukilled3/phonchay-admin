import { useMemo, useState } from 'react'
import { PRODUCTS, channel, product } from '../data/seed.js'
import { deaccent, dmy } from '../lib/format.js'
import { NumInput, Tag, TrashIcon } from '../components/bits.jsx'
import Reveal from '../components/Reveal.jsx'

const STATUS = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' }

export default function RequestStock({ ch, wh, stock, requests, onSubmit, onBack, toast }) {
  const c = channel(ch)
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const matches = useMemo(() => {
    const k = deaccent(q.trim())
    return PRODUCTS.filter((p) => !rows.some((r) => r.sku === p.sku))
      .filter((p) => !k || deaccent(`${p.sku} ${p.name} ${p.variant}`).includes(k))
      .slice(0, 6)
  }, [q, rows])

  function add(p) {
    if ((wh[p.sku] ?? 0) <= 0) {
      toast(`${p.sku} đang hết ở kho tổng.`)
      return
    }
    setRows((r) => [...r, { sku: p.sku, qty: 1 }])
    setQ('')
    setOpen(false)
  }

  function setQty(sku, n) {
    const max = wh[sku] ?? 0
    if (n > max) toast(`Kho tổng chỉ còn ${max} ${sku}.`)
    setRows((r) => r.map((x) => (x.sku === sku ? { ...x, qty: Math.min(Math.max(1, n), max) } : x)))
  }

  const mine = requests.filter((r) => r.ch === ch)
  const total = rows.reduce((s, r) => s + r.qty, 0)

  return (
    <>
      <div className="ch-bar">
        <button type="button" className="back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13 8H4M7.5 4.5L4 8l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {c.name}
        </button>
      </div>

      <Reveal as="section" className="card rs-lines">
        <header>
          <h2>Yêu cầu lấy hàng từ kho tổng</h2>
          <Tag ch={c} />
        </header>
        <p className="hint">Owner duyệt thì hàng mới vào tồn kênh {c.name}. Chỉ chọn được số lượng kho tổng đang có.</p>

        <div className="rs-find">
          <input
            className="input"
            placeholder="Tìm SKU hoặc tên sản phẩm"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            aria-label="Tìm sản phẩm để yêu cầu"
          />
          {open && matches.length > 0 && (
            <ul className="rs-drop">
              {matches.map((p) => (
                <li key={p.sku}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(p)}>
                    <b>{p.name}</b> <span>{p.variant}</span>
                    <small>kho tổng {wh[p.sku] ?? 0} · {p.sku}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rs-rows">
          {rows.map((r) => {
            const p = product(r.sku)
            return (
              <div className="rq-row" key={r.sku}>
                <div className="rs-name">
                  <b>{p.name}</b>
                  <span>{p.variant} · {p.sku}</span>
                </div>
                <div className="rs-cell">
                  <span className="k">Kho tổng / kênh</span>
                  <span className="v">{wh[r.sku] ?? 0} / {stock[r.sku]?.[ch] ?? 0}</span>
                </div>
                <div className="rs-cell">
                  <span className="k">SL lấy</span>
                  <div className="stepper">
                    <button type="button" aria-label="Giảm" disabled={r.qty <= 1} onClick={() => setQty(r.sku, r.qty - 1)}>−</button>
                    <NumInput value={r.qty} onCommit={(n) => setQty(r.sku, n)} aria-label={`Số lượng lấy ${p.name} ${p.variant}`} />
                    <button type="button" aria-label="Tăng" onClick={() => setQty(r.sku, r.qty + 1)}>+</button>
                  </div>
                </div>
                <button type="button" className="icon-btn" aria-label={`Bỏ ${p.name} ${p.variant}`} onClick={() => setRows((x) => x.filter((y) => y.sku !== r.sku))}>
                  <TrashIcon />
                </button>
              </div>
            )
          })}
        </div>

        <div className="actions rs-actions">
          <span className="hint rq-total">{rows.length} SKU · {total} sp</span>
          <button type="button" className="btn" disabled={!rows.length} onClick={() => { onSubmit(ch, rows); setRows([]) }}>
            Gửi yêu cầu cho owner
          </button>
        </div>
      </Reveal>

      <Reveal as="section" className="card">
        <header>
          <h2>Yêu cầu của kênh {c.name}</h2>
        </header>
        {mine.length === 0 && <p className="hint">Chưa có yêu cầu nào.</p>}
        <ul className="rs-hist rq-hist">
          {mine.map((r) => (
            <li key={r.id}>
              <b>{r.id}</b>
              <span>{dmy(r.date)}</span>
              <span>{r.lines.reduce((s, l) => s + l.qty, 0)} sp</span>
              <span className={`rq-st is-${r.status}`}>{STATUS[r.status]}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </>
  )
}
