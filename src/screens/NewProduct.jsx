import { useState } from 'react'
import { CHANNELS, PRODUCTS } from '../data/seed.js'
import { deaccent, money, pct } from '../lib/format.js'
import { NumInput } from '../components/bits.jsx'
import Reveal from '../components/Reveal.jsx'

// "Áo thun Phở" + "Đen / M" -> "PC-ATP-DEN-M"
function suggestSku(name, variant) {
  const initials = deaccent(name).split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase()
  const v = deaccent(variant).split(/[\s/]+/).filter(Boolean).map((w) => w.slice(0, 3).toUpperCase()).join('-')
  return ['PC', initials, v].filter(Boolean).join('-')
}

export default function NewProduct({ role, inline = false, onBack, onSave, toast }) {
  const owner = role === 'owner'
  const [name, setName] = useState('')
  const [variant, setVariant] = useState('')
  const [sku, setSku] = useState('')
  const [skuTouched, setSkuTouched] = useState(false)
  const [cost, setCost] = useState(0)
  const [base, setBase] = useState(0)
  const [prices, setPrices] = useState({}) // giá riêng từng kênh, trống = theo giá gốc
  const [qty, setQty] = useState(0) // tồn đầu kỳ, vào kho tổng

  const shownSku = skuTouched ? sku : suggestSku(name, variant)
  const dup = PRODUCTS.some((p) => p.sku === shownSku)
  const valid = name.trim() && shownSku && !dup && base > 0 && cost >= 0

  function save() {
    onSave(
      {
        sku: shownSku,
        name: name.trim(),
        variant: variant.trim() || 'Mặc định',
        base,
        cost,
        prices: Object.fromEntries(CHANNELS.map((c) => [c.id, prices[c.id] || base])),
      },
      qty,
    )
  }

  return (
    <>
      {inline ? (
        <div className="ch-bar np-inline-head">
          <h2>Sản phẩm mới</h2>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Đóng
          </button>
        </div>
      ) : (
        <div className="ch-bar">
          <button type="button" className="back" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M13 8H4M7.5 4.5L4 8l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Quay lại
          </button>
        </div>
      )}

      <div className="np-layout">
        <div className="np-main">
          <Reveal as="section" className="card">
            <header><h2>Thông tin cơ bản</h2></header>
            <div className="rs-grid">
              <div className="field">
                <label htmlFor="np-name">Tên sản phẩm</label>
                <input id="np-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Áo thun Phở" />
              </div>
              <div className="field">
                <label htmlFor="np-var">Biến thể (màu / size)</label>
                <input id="np-var" className="input" value={variant} onChange={(e) => setVariant(e.target.value)} placeholder="Đen / M" />
              </div>
              <div className="field">
                <label htmlFor="np-sku">SKU</label>
                <input
                  id="np-sku"
                  className="input"
                  value={shownSku}
                  aria-invalid={dup || undefined}
                  onChange={(e) => {
                    setSkuTouched(true)
                    setSku(e.target.value.toUpperCase())
                  }}
                />
                {dup && <span className="hint np-err">SKU này đã có.</span>}
              </div>
            </div>
          </Reveal>

          <Reveal as="section" className="card">
            <header>
              <h2>{owner ? 'Giá vốn và giá bán theo kênh' : 'Giá bán theo kênh'}</h2>
              <span className="hint">
                Để trống giá kênh thì lấy theo giá gốc.{owner ? '' : ' Giá vốn do owner điền sau.'}
              </span>
            </header>
            <div className="rs-grid">
              {owner && (
                <div className="field">
                  <label htmlFor="np-cost">Giá vốn</label>
                  <NumInput id="np-cost" className="input" value={cost} onCommit={setCost} />
                </div>
              )}
              <div className="field">
                <label htmlFor="np-base">Giá bán gốc</label>
                <NumInput id="np-base" className="input" value={base} onCommit={setBase} />
              </div>
            </div>
            <div className="np-ch">
              {CHANNELS.map((c) => {
                const price = prices[c.id] || base
                const net = price * (1 - c.fee) - cost
                const margin = price > 0 ? net / price : 0
                return (
                  <div className={`np-ch-row${owner ? '' : ' is-staff'}`} key={c.id} style={{ '--ch': `var(${c.v})` }}>
                    <span className="np-ch-name">{c.name}</span>
                    <NumInput
                      className="input"
                      value={prices[c.id] ?? ''}
                      placeholder={String(base)}
                      onCommit={(n) => setPrices((p) => ({ ...p, [c.id]: n }))}
                      aria-label={`Giá bán kênh ${c.name}`}
                    />
                    {owner && (
                      <>
                        <span className="np-ch-meta">Phí {pct(c.fee)}</span>
                        <span className={`np-ch-meta ${margin < 0.25 ? 'is-down' : 'is-up'}`}>
                          Lãi {price > 0 && cost > 0 ? pct(margin) : '—'}
                        </span>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </Reveal>

          <Reveal as="section" className="card">
            <header>
              <h2>Tồn kho tổng đầu kỳ</h2>
              <span className="hint">Số lượng đưa vào kho tổng. Để 0 nếu chưa nhập hàng.</span>
            </header>
            <div className="rs-grid">
              <div className="field">
                <label htmlFor="np-q">Số lượng</label>
                <NumInput id="np-q" className="input" value={qty} onCommit={setQty} />
              </div>
            </div>
          </Reveal>
        </div>

        <aside className="np-side">
          <Reveal className="card np-preview">
            <p className="lbl">Xem trước</p>
            <b className="np-p-name">{name || 'Tên sản phẩm'}</b>
            <span className="np-p-var">{variant || 'Biến thể'}</span>
            <span className="np-p-sku">{shownSku || 'SKU'}</span>
            <span className="np-p-price">{base ? money(base) : '—'}</span>
            <div className="actions">
              <button type="button" className="btn" disabled={!valid} onClick={save}>Lưu sản phẩm</button>
              <button type="button" className="btn btn-secondary" onClick={() => toast('Đã lưu nháp sản phẩm.')}>Lưu nháp</button>
            </div>
          </Reveal>
        </aside>
      </div>
    </>
  )
}
