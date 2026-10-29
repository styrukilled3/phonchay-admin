import { CHANNELS, PRODUCTS, needsPrice, priceOf } from '../data/seed.js'
import { compact, pct } from '../lib/format.js'
import { NumInput } from '../components/bits.jsx'
import Reveal from '../components/Reveal.jsx'

export default function Products({ onEdit }) {
  // Kênh ăn phí nặng nhất: nhìn margin ở đây là thấy SKU nào mỏng lãi nhất
  const worstFee = CHANNELS.reduce((a, c) => (c.fee > a.fee ? c : a), CHANNELS[0])

  return (
    <Reveal as="section" className="card">
      <header>
        <h2>Bảng giá SKU × kênh</h2>
        <span className="hint">
          {PRODUCTS.length} SKU. Sửa giá vốn và giá gốc ở đây, giá từng kênh tự tính. Hàng đã chuyển xuống kênh giữ giá lúc chuyển.
        </span>
      </header>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Sản phẩm</th>
              <th className="num">Giá vốn</th>
              <th className="num">Giá gốc</th>
              {CHANNELS.map((c) => (
                <th key={c.id} className="num">
                  {c.code}
                </th>
              ))}
              <th className="num">Margin {worstFee.code}</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => {
              const spPrice = priceOf(p.sku, worstFee.id)
              const spNet = spPrice - spPrice * worstFee.fee
              return (
                <tr key={p.sku}>
                  <td className="mono">{p.sku}</td>
                  <td>
                    {p.name} <span className="muted">· {p.variant}</span>
                  </td>
                  <td className="num">
                    <NumInput className="input cell-in" value={p.cost} onCommit={(n) => onEdit(p.sku, { cost: n })} aria-label={`Giá vốn ${p.sku}`} />
                  </td>
                  <td className="num">
                    <NumInput className="input cell-in" value={p.base} onCommit={(n) => onEdit(p.sku, { base: n })} aria-label={`Giá gốc ${p.sku}`} />
                    {needsPrice(p) && <span className="flag">Chưa đủ giá</span>}
                  </td>
                  {CHANNELS.map((c) => (
                    <td key={c.id} className="num">
                      {priceOf(p.sku, c.id) > 0 ? compact(priceOf(p.sku, c.id)) : <span className="muted">—</span>}
                    </td>
                  ))}
                  <td className="num">{!needsPrice(p) ? pct((spNet - p.cost) / spNet) : <span className="muted">—</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="hint">
        Cột Margin {worstFee.code} tính trên kênh {worstFee.name} sau phí {pct(worstFee.fee)}, để thấy
        SKU nào mỏng lãi nhất.
      </p>
    </Reveal>
  )
}
