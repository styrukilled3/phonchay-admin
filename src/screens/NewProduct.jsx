import { useState } from 'react'
import { CHANNELS, PRODUCTS, channelPrice } from '../data/seed.js'
import { deaccent, money, pct } from '../lib/format.js'
import { NumInput } from '../components/bits.jsx'
import Reveal from '../components/Reveal.jsx'

const PRESET_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Freesize']

// "Áo thun Phở" + "Đen" + "M" -> "PC-ATP-DEN-M"; Freesize rút thành OS như các SKU cũ
function buildSku(name, color, size) {
  const initials = deaccent(name).split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase()
  const c = deaccent(color).split(/\s+/).filter(Boolean).map((w) => w.slice(0, 3).toUpperCase()).join('')
  const sz = size === 'Freesize' ? 'OS' : deaccent(size).toUpperCase().replace(/\s+/g, '')
  return ['PC', initials, c, sz].filter(Boolean).join('-')
}

export default function NewProduct({ role, inline = false, onBack, onSave, toast }) {
  const owner = role === 'owner'
  const [name, setName] = useState('')
  const [color, setColor] = useState('')
  const [sizes, setSizes] = useState([]) // mỗi size là một SKU riêng
  const [customSize, setCustomSize] = useState('')
  const [cost, setCost] = useState(0)
  const [base, setBase] = useState(0)
  const [qty, setQty] = useState({}) // tồn đầu kỳ theo size, vào kho tổng
  const [skuEdit, setSkuEdit] = useState({}) // SKU sửa tay theo size, không sửa thì dùng mã tự đặt

  // Giữ thứ tự S M L XL... rồi tới size tự thêm
  const ordered = [...sizes].sort((a, b) => {
    const ia = PRESET_SIZES.indexOf(a)
    const ib = PRESET_SIZES.indexOf(b)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })
  const items = ordered.map((size) => {
    const auto = buildSku(name, color, size)
    const typed = skuEdit[size]
    return {
      size,
      auto,
      sku: typed !== undefined ? typed.toUpperCase().replace(/\s+/g, '') : auto,
      variant: color.trim() ? `${color.trim()} / ${size}` : size,
    }
  })
  const dups = items
    .filter((it, i) => PRODUCTS.some((p) => p.sku === it.sku) || items.findIndex((x) => x.sku === it.sku) !== i)
    .map((it) => it.sku)
  const empty = items.some((it) => !it.sku)
  const valid = name.trim() && items.length > 0 && dups.length === 0 && !empty && (!owner || base > 0)

  function toggleSize(sz) {
    setSizes((l) => (l.includes(sz) ? l.filter((x) => x !== sz) : [...l, sz]))
  }

  function addCustom() {
    const sz = customSize.trim()
    if (sz && !sizes.includes(sz)) setSizes((l) => [...l, sz])
    setCustomSize('')
  }

  function save() {
    onSave(
      items.map((it) => ({
        product: { sku: it.sku, name: name.trim(), variant: it.variant, base: owner ? base : 0, cost: owner ? cost : 0 },
        qty: qty[it.size] ?? 0,
      })),
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
                <label htmlFor="np-color">Màu</label>
                <input id="np-color" className="input" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Đen" />
              </div>
            </div>

            <div className="field">
              <label id="np-size-l">Size (chọn nhiều, mỗi size là một SKU riêng)</label>
              <div className="np-sizes" role="group" aria-labelledby="np-size-l">
                {[...PRESET_SIZES, ...sizes.filter((x) => !PRESET_SIZES.includes(x))].map((sz) => (
                  <button key={sz} type="button" className="np-chip" aria-pressed={sizes.includes(sz)} onClick={() => toggleSize(sz)}>
                    {sz}
                  </button>
                ))}
                <span className="np-custom">
                  <input
                    className="input"
                    value={customSize}
                    placeholder="Size khác"
                    aria-label="Thêm size khác"
                    onChange={(e) => setCustomSize(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustom()
                      }
                    }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={addCustom}>Thêm</button>
                </span>
              </div>
            </div>

            <div className="field">
              <label id="np-sku-l">SKU sẽ tạo</label>
              {items.length === 0 ? (
                <p className="hint">Chọn size, hệ thống tự đặt một mã SKU riêng cho từng size. Sửa tay được nếu hàng đã có mã.</p>
              ) : (
                <div className="np-skus" role="group" aria-labelledby="np-sku-l">
                  {items.map((it) => (
                    <div className="np-sku-row" key={it.size}>
                      <span className="np-sku-size">{it.size}</span>
                      <input
                        className="input mono"
                        value={skuEdit[it.size] ?? it.auto}
                        aria-label={`SKU size ${it.size}`}
                        onChange={(e) => setSkuEdit((m) => ({ ...m, [it.size]: e.target.value }))}
                      />
                      {skuEdit[it.size] !== undefined && skuEdit[it.size] !== it.auto && (
                        <button type="button" className="link-btn" onClick={() => setSkuEdit((m) => { const n = { ...m }; delete n[it.size]; return n })}>
                          Về mã tự đặt
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {dups.length > 0 && <span className="hint np-err">SKU bị trùng hoặc đã có: {[...new Set(dups)].join(', ')}.</span>}
              {empty && <span className="hint np-err">Có SKU đang để trống.</span>}
            </div>
          </Reveal>

          {owner ? (
            <Reveal as="section" className="card">
              <header>
                <h2>Giá vốn và giá bán</h2>
                <span className="hint">Nhập giá gốc, giá từng kênh tự tính khi chuyển kho xuống kênh.</span>
              </header>
              <div className="rs-grid">
                <div className="field">
                  <label htmlFor="np-cost">Giá vốn</label>
                  <NumInput id="np-cost" className="input" value={cost} onCommit={setCost} />
                </div>
                <div className="field">
                  <label htmlFor="np-base">Giá bán gốc</label>
                  <NumInput id="np-base" className="input" value={base} onCommit={setBase} />
                </div>
              </div>
              <div className="np-ch">
                {CHANNELS.map((c) => {
                  const price = channelPrice(base, c.id)
                  const margin = price > 0 ? (price * (1 - c.fee) - cost) / price : 0
                  return (
                    <div className="np-ch-row" key={c.id} style={{ '--ch': `var(${c.v})` }}>
                      <span className="np-ch-name">{c.name}</span>
                      <span className="np-ch-price">{price > 0 ? money(price) : '—'}</span>
                      <span className="np-ch-meta">Phí {pct(c.fee)}</span>
                      <span className={`np-ch-meta ${margin < 0.25 ? 'is-down' : 'is-up'}`}>
                        Lãi {price > 0 && cost > 0 ? pct(margin) : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Reveal>
          ) : (
            <p className="hint np-note">Giá vốn và giá bán do owner điền sau. Sản phẩm chưa có giá thì chưa chuyển kho xuống kênh được.</p>
          )}

          <Reveal as="section" className="card">
            <header>
              <h2>Tồn kho tổng đầu kỳ</h2>
              <span className="hint">Số lượng từng size đưa vào kho tổng. Để 0 nếu chưa nhập hàng.</span>
            </header>
            {items.length === 0 ? (
              <p className="hint">Chọn size ở trên để nhập số lượng từng size.</p>
            ) : (
              <div className="np-stock">
                {items.map((it) => (
                  <div className="field" key={it.size}>
                    <label htmlFor={`np-q-${it.size}`}>Size {it.size}</label>
                    <NumInput
                      id={`np-q-${it.size}`}
                      className="input"
                      value={qty[it.size] ?? 0}
                      onCommit={(n) => setQty((q) => ({ ...q, [it.size]: n }))}
                    />
                  </div>
                ))}
              </div>
            )}
          </Reveal>
        </div>

        <aside className="np-side">
          <Reveal className="card np-preview">
            <p className="lbl">Xem trước</p>
            <b className="np-p-name">{name || 'Tên sản phẩm'}</b>
            <span className="np-p-var">{color || 'Màu'}</span>
            <ul className="np-p-skus">
              {items.length === 0 && <li>Chưa chọn size</li>}
              {items.map((it) => (
                <li key={it.sku}>{it.sku}</li>
              ))}
            </ul>
            {owner && <span className="np-p-price">{base ? money(base) : '—'}</span>}
            <div className="actions">
              <button type="button" className="btn" disabled={!valid} onClick={save}>{items.length > 1 ? `Lưu ${items.length} SKU` : 'Lưu sản phẩm'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => toast('Đã lưu nháp sản phẩm.')}>Lưu nháp</button>
            </div>
          </Reveal>
        </aside>
      </div>
    </>
  )
}
