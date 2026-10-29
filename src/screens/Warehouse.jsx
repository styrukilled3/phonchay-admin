import { useState } from 'react'
import { CHANNELS, PRODUCTS, channel, product } from '../data/seed.js'
import { skuUnits, stockStats, stockStatus } from '../lib/stock.js'
import { dmy } from '../lib/format.js'
import { Tag } from '../components/bits.jsx'
import CountUp from '../components/CountUp.jsx'
import Reveal from '../components/Reveal.jsx'
import NewProduct from './NewProduct.jsx'

const STATUS = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' }
const nf = (n) => Math.round(n).toLocaleString('vi-VN')

function Badge({ status }) {
  if (status === 'out') return <span className="stk-badge is-out">Hết hàng</span>
  if (status === 'low') return <span className="stk-badge is-low">Sắp hết</span>
  return null
}

export default function Warehouse({ role, wh, stock, requests, onRestock, onCreate, onApprove, onReject, onRequest, toast }) {
  const owner = role === 'owner'
  const [creating, setCreating] = useState(false)
  const st = stockStats(wh)
  const pending = requests.filter((r) => r.status === 'pending')

  return (
    <>
      <Reveal className="rs-kpis wh-kpis">
        <div className="kpi">
          <span className="lbl">Tổng kho</span>
          <span className="val"><CountUp value={st.units} format={nf} /> sp</span>
        </div>
        <div className="kpi">
          <span className="lbl">Sắp hết</span>
          <span className="val is-low"><CountUp value={st.low} /> SKU</span>
        </div>
        <div className="kpi">
          <span className="lbl">Hết hàng</span>
          <span className="val is-out"><CountUp value={st.out} /> SKU</span>
        </div>
        <div className="kpi">
          <span className="lbl">Chờ duyệt</span>
          <span className="val"><CountUp value={pending.length} /> yêu cầu</span>
        </div>
      </Reveal>

      {creating && (
        <Reveal as="section" className="card np-panel">
          <NewProduct
            role={role}
            inline
            toast={toast}
            onBack={() => setCreating(false)}
            onSave={(p, qty) => {
              onCreate(p, qty)
              setCreating(false)
            }}
          />
        </Reveal>
      )}

      {!owner && (
        <>
          <div className="zone-actions">
            <Reveal as="button" type="button" className="act-box" onClick={() => setCreating((v) => !v)}>
              <span className="act-plus" aria-hidden="true">+</span>
              <span className="act-txt">
                <b>Tạo sản phẩm mới</b>
                <span>Thêm SKU và đặt giá bán theo kênh</span>
              </span>
            </Reveal>
          </div>

          <div className="zone-actions zone-ch">
            {CHANNELS.map((c) => (
              <Reveal as="button" type="button" className="act-box" key={c.id} onClick={() => onRequest(c.id)}>
                <span className="act-plus" aria-hidden="true">+</span>
                <span className="act-txt">
                  <b>Lấy hàng cho {c.name}</b>
                  <span>Gửi yêu cầu, owner duyệt thì vào tồn kênh</span>
                </span>
              </Reveal>
            ))}
          </div>

          <Reveal as="section" className="card">
            <header>
              <h2>Yêu cầu đã gửi</h2>
            </header>
            {requests.length === 0 && <p className="hint">Chưa có yêu cầu nào.</p>}
            <ul className="rs-hist rq-hist">
              {requests.map((r) => (
                <li key={r.id}>
                  <b>{r.id} · {channel(r.ch).name}</b>
                  <span>{dmy(r.date)}</span>
                  <span>{r.lines.reduce((n, l) => n + l.qty, 0)} sp</span>
                  <span className={`rq-st is-${r.status}`}>{STATUS[r.status]}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </>
      )}

      {owner && (
        <>
      <div className="zone-actions">
        <Reveal as="button" type="button" className="act-box" onClick={onRestock}>
          <span className="act-plus" aria-hidden="true">+</span>
          <span className="act-txt">
            <b>Nhập hàng</b>
            <span>Nhập từ nhà cung cấp vào kho tổng</span>
          </span>
        </Reveal>
        <Reveal as="button" type="button" className="act-box" onClick={() => setCreating((v) => !v)}>
          <span className="act-plus" aria-hidden="true">+</span>
          <span className="act-txt">
            <b>Tạo sản phẩm mới</b>
            <span>Thêm SKU, giá vốn, giá bán theo kênh</span>
          </span>
        </Reveal>
      </div>

      <Reveal as="section" className="card">
        <header>
          <h2>Yêu cầu lấy hàng từ kênh</h2>
          <span className="hint">Duyệt thì kho tổng trừ, tồn kênh cộng.</span>
        </header>
        {pending.length === 0 && <p className="hint">Không có yêu cầu nào đang chờ.</p>}
        <div className="rs-rows">
          {pending.map((r) => {
            const enough = r.lines.every((l) => (wh[l.sku] ?? 0) >= l.qty)
            return (
              <div className="rq-card" key={r.id}>
                <div className="rq-head">
                  <Tag ch={channel(r.ch)} />
                  <b>{r.id}</b>
                  <span className="hint">{dmy(r.date)}</span>
                </div>
                <ul className="rq-lines">
                  {r.lines.map((l) => {
                    const p = product(l.sku)
                    const have = wh[l.sku] ?? 0
                    return (
                      <li key={l.sku}>
                        <span>{p.name} · {p.variant}</span>
                        <b>×{l.qty}</b>
                        <span className={have >= l.qty ? 'hint' : 'rq-short'}>kho tổng còn {have}</span>
                      </li>
                    )
                  })}
                </ul>
                <div className="actions rs-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => onReject(r.id)}>Từ chối</button>
                  <button type="button" className="btn" disabled={!enough} onClick={() => onApprove(r.id)}>
                    {enough ? 'Duyệt và chuyển kho' : 'Kho tổng không đủ'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Reveal>

        </>
      )}

      <Reveal as="section" className="card">
        <header>
          <h2>Tồn kho theo SKU</h2>
          <span className="hint">Kho tổng và tồn từng kênh.</span>
        </header>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Sản phẩm</th>
                <th className="num">Kho tổng</th>
                {CHANNELS.map((c) => (
                  <th key={c.id} className="num">{c.code}</th>
                ))}
                <th className="num">Tổng kênh</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((p) => (
                <tr key={p.sku}>
                  <td>{p.sku}</td>
                  <td>
                    {p.name} · {p.variant} <Badge status={stockStatus(wh, p)} />
                  </td>
                  <td className="num"><b>{wh[p.sku] ?? 0}</b></td>
                  {CHANNELS.map((c) => (
                    <td key={c.id} className="num">{stock[p.sku]?.[c.id] ?? 0}</td>
                  ))}
                  <td className="num">{skuUnits(stock, p.sku)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </>
  )
}
