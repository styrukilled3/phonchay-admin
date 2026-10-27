import { CHANNELS, PRODUCTS, priceOf } from '../data/seed.js'
import { compact, pct } from '../lib/format.js'
import Reveal from '../components/Reveal.jsx'

export default function Products() {
  // Kênh ăn phí nặng nhất: nhìn margin ở đây là thấy SKU nào mỏng lãi nhất
  const worstFee = CHANNELS.reduce((a, c) => (c.fee > a.fee ? c : a), CHANNELS[0])

  return (
    <Reveal as="section" className="card">
      <header>
        <h2>Bảng giá SKU × kênh</h2>
        <span className="hint">
          {PRODUCTS.length} SKU. Giá bán riêng từng kênh, giá vốn chung. Nhân viên không sửa giá khi báo bán.
        </span>
      </header>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Sản phẩm</th>
              <th className="num">Giá vốn</th>
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
                  <td className="num">{compact(p.cost)}</td>
                  {CHANNELS.map((c) => (
                    <td key={c.id} className="num">
                      {compact(priceOf(p.sku, c.id))}
                    </td>
                  ))}
                  <td className="num">{pct((spNet - p.cost) / spNet)}</td>
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
