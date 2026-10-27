import { stockStats } from '../lib/stock.js'
import CountUp from './CountUp.jsx'

/* Thanh tổng kho: số lượng + thanh chia ổn / sắp hết / hết hàng. Bấm để sang Nhập hàng. */
export default function StockBar({ stock, onOpen, compact = false }) {
  const s = stockStats(stock)
  const part = (n) => `${(n / s.skus) * 100}%`

  return (
    <button type="button" className={`stockbar${compact ? ' is-compact' : ''}`} onClick={onOpen}>
      <span className="sb-top">
        <span className="sb-lbl">Tổng kho</span>
        <span className="sb-go">Nhập hàng →</span>
      </span>
      <span className="sb-num">
        <CountUp value={s.units} format={(n) => Math.round(n).toLocaleString('vi-VN')} />
        <small> sp</small>
      </span>
      <span className="sb-bar" role="img" aria-label={`${s.ok} SKU ổn, ${s.low} sắp hết, ${s.out} hết hàng`}>
        <i className="ok" style={{ width: part(s.ok) }} />
        <i className="low" style={{ width: part(s.low) }} />
        <i className="out" style={{ width: part(s.out) }} />
      </span>
      <span className="sb-legend">
        <span className="low">Sắp hết: {s.low} SKU</span>
        <span className="out">Hết hàng: {s.out} SKU</span>
      </span>
    </button>
  )
}
