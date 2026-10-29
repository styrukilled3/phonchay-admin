import { useRef, useState } from 'react'
import { DATES, channel, PRODUCTS, priceOf, product } from '../data/seed.js'
import { deaccent, dmy, money, pct } from '../lib/format.js'
import { LockIcon, NumInput, StatusChip, Tag, TrashIcon } from '../components/bits.jsx'
import Reveal from '../components/Reveal.jsx'

export default function Entry({ role, date, setDate, ch, rows, setRows, status, onSend, onSave, toast, avail, lineTotal }) {
  const [query, setQuery] = useState('')
  const searchRef = useRef(null)
  const chn = channel(ch)
  const owner = role === 'owner'
  const locked = status === 'locked'

  const sub = rows.reduce((a, r) => a + lineTotal(r.sku, r.qty), 0)
  const qty = rows.reduce((a, r) => a + r.qty, 0)
  const fee = Math.round(sub * chn.fee)
  const cogs = rows.reduce((a, r) => a + product(r.sku).cost * r.qty, 0)

  const hits = (() => {
    const q = query.trim()
    if (!q) return []
    const terms = deaccent(q).split(/\s+/)
    return PRODUCTS.filter((p) => {
      const hay = deaccent(`${p.sku} ${p.name} ${p.variant}`)
      return terms.every((t) => hay.includes(t))
    }).slice(0, 8)
  })()

  function addRow(sku) {
    const found = rows.find((r) => r.sku === sku)
    const max = avail(sku)
    if (found) {
      if (found.qty >= max) {
        toast(`${sku} chỉ còn ${max} ở kênh này.`)
      } else {
        setRows(rows.map((r) => (r.sku === sku ? { ...r, qty: r.qty + 1 } : r)))
        toast(`Đã cộng dồn vào dòng ${sku} (chống nhập trùng).`)
      }
    } else if (max <= 0) {
      toast(`${sku} hết tồn ở kênh này. Gửi yêu cầu lấy hàng từ kho tổng.`)
    } else {
      setRows([...rows, { sku, qty: 1, price: priceOf(sku, ch), override: false }])
    }
    setQuery('')
    searchRef.current?.focus()
  }

  function patch(idx, next) {
    if (next.qty != null) {
      const max = avail(rows[idx].sku)
      if (next.qty > max) {
        toast(`${rows[idx].sku} chỉ còn ${max} ở kênh này.`)
        next = { ...next, qty: max }
      }
    }
    setRows(rows.map((r, i) => (i === idx ? { ...r, ...next } : r)))
  }

  function remove(idx) {
    const removed = rows[idx]
    const before = rows
    setRows(rows.filter((_, i) => i !== idx))
    toast(`Đã xóa dòng ${removed.sku}.`, () => setRows(before))
  }

  return (
    <>
      <Reveal as="section" className="card">
        <header>
          <h2>Ngày bán</h2>
          <StatusChip status={status} />
        </header>

        <div className="pick-grid">
          <div className="field">
            <label htmlFor="d">Chọn ngày</label>
            <input
              className="input num"
              type="date"
              id="d"
              value={date}
              min={DATES[0]}
              max={DATES[DATES.length - 1]}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </div>
        </div>

        {locked && (
          <p className="banner locked">
            <LockIcon />
            <span>
              Ngày {dmy(date)} đã chốt sổ. Dòng bán chỉ đọc, muốn sửa thì owner phải mở khóa và việc đó
              được ghi vào audit log.
            </span>
          </p>
        )}
        {!locked && status === 'sent' && (
          <p className="banner">
            <span>Đã gửi ngày này cho owner. Mày vẫn sửa được đến khi owner chốt sổ. Gửi lại thì tồn kênh tính lại.</span>
          </p>
        )}
      </Reveal>

      {!locked && (
        <section className="card card-finder">
          <header>
            <h2>Thêm dòng bán</h2>
            <span className="hint">Gõ mã, tên, màu hoặc size. Enter để thêm dòng đầu trong danh sách.</span>
          </header>
          <div className="finder field">
            <label htmlFor="q">Tìm SKU</label>
            <input
              className="input"
              id="q"
              ref={searchRef}
              autoComplete="off"
              placeholder="pho den m, hoodie, cap..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && hits.length) {
                  e.preventDefault()
                  addRow(hits[0].sku)
                } else if (e.key === 'Escape') {
                  setQuery('')
                }
              }}
            />
            {query.trim() !== '' && (
              <ul className="results">
                {hits.length === 0 ? (
                  <li>
                    <div className="muted no-hit">Không có SKU nào khớp &quot;{query}&quot;</div>
                  </li>
                ) : (
                  hits.map((p, i) => (
                    <li key={p.sku}>
                      <button type="button" className={i === 0 ? 'on' : ''} onClick={() => addRow(p.sku)}>
                        <span>
                          <span className="r-sku">{p.sku}</span>
                          <br />
                          <span className="r-nm">
                            {p.name} · {p.variant}
                          </span>
                        </span>
                        <span className="r-price">
                          {owner ? `${money(priceOf(p.sku, ch))} · ` : ''}tồn {avail(p.sku)}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </section>
      )}

      <Reveal as="section" className="card">
        <header>
          <h2>Dòng bán {dmy(date)}</h2>
          <Tag ch={chn}>
            {chn.id} · {chn.name}
          </Tag>
        </header>

        {rows.length === 0 ? (
          <div className="empty">
            <p>
              <b>Chưa có dòng bán nào cho ngày này.</b>
            </p>
            <p className="muted small">Tìm SKU ở trên để thêm dòng đầu tiên.</p>
          </div>
        ) : (
          <>
            <div className="rows">
              {rows.map((r, idx) => {
                const p = product(r.sku)
                return (
                  <div className={`erow${owner ? '' : ' is-staff'}`} key={r.sku}>
                    <div className="who">
                      <span className="sku">{r.sku}</span>
                      <span className="nm">
                        {p.name} · {p.variant}
                      </span>
                      <span className="nm">Tồn kênh {avail(r.sku)}</span>
                    </div>

                    {owner && (
                    <div className="price-f price-static">
                      <span className="k">Giá kênh</span>
                      <span className="v">{money(r.qty > 0 ? lineTotal(r.sku, r.qty) / r.qty : lineTotal(r.sku, 1))}</span>
                    </div>
                    )}

                    <div className="stepper">
                      <button
                        type="button"
                        aria-label={`Giảm số lượng dòng ${idx + 1}`}
                        disabled={locked}
                        onClick={() => patch(idx, { qty: Math.max(0, r.qty - 1) })}
                      >
                        −
                      </button>
                      <NumInput
                        value={r.qty}
                        disabled={locked}
                        aria-label={`Số lượng dòng ${idx + 1}`}
                        onCommit={(v) => patch(idx, { qty: v })}
                      />
                      <button
                        type="button"
                        aria-label={`Tăng số lượng dòng ${idx + 1}`}
                        disabled={locked}
                        onClick={() => patch(idx, { qty: r.qty + 1 })}
                      >
                        +
                      </button>
                    </div>

                    {owner && (
                    <div className="line">
                      {money(lineTotal(r.sku, r.qty))}
                    </div>
                    )}

                    {locked ? (
                      <span />
                    ) : (
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Xóa dòng ${idx + 1}`}
                        onClick={() => remove(idx)}
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="total-strip">
              <div className="t">
                <span className="lbl">Số lượng</span>
                <span className="v">{qty}</span>
              </div>
              {owner && (
                <>
                  <div className="t">
                    <span className="lbl">Doanh thu gộp</span>
                    <span className="v">{money(sub)}</span>
                  </div>
                  <div className="t">
                    <span className="lbl">Phí kênh {pct(chn.fee)}</span>
                    <span className="v" style={{ color: 'var(--down)' }}>
                      −{money(fee)}
                    </span>
                  </div>
                  <div className="t">
                    <span className="lbl">Lãi gộp</span>
                    <span className="v" style={{ color: 'var(--up)' }}>
                      {money(sub - fee - cogs)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {!locked && (
          <div className="actions">
            <button type="button" className="btn btn-primary" disabled={!rows.length} onClick={onSend}>
              {status === 'sent' ? 'Gửi lại ngày' : 'Gửi ngày'}
            </button>
            <button type="button" className="btn btn-secondary" disabled={!rows.length} onClick={onSave}>
              Lưu nháp
            </button>
          </div>
        )}
      </Reveal>
    </>
  )
}
