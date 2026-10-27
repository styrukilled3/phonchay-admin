import { CHANNELS, PRODUCTS, priceOf } from '../data/seed.js'
import { compact, pct } from '../lib/format.js'

export default function Products() {
  return (
    <section className="card reveal" style={{ '--i': 0 }}>
      <header>
        <h2>Bảng giá SKU × kênh</h2>
        <span className="hint">
          {PRODUCTS.length} SKU. Giá niêm yết mặc định, lúc nhập vẫn ghi đè được.
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
                  {c.id}
                </th>
              ))}
              <th className="num">Margin SP</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => {
              const spPrice = priceOf(p.sku, 'SP')
              const spNet = spPrice - spPrice * 0.11
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
        Cột Margin SP tính trên kênh Shopee sau phí 11%, để thấy SKU nào mỏng lãi nhất trên sàn.
      </p>
    </section>
  )
}
