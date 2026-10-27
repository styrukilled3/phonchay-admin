import { DATES, PRODUCTS, channel, product } from '../data/seed.js'
import { aggOf } from '../lib/calc.js'
import { compact, money, pct } from '../lib/format.js'
import { AreaOne } from '../components/Chart.jsx'
import Entry from './Entry.jsx'
import Reveal from '../components/Reveal.jsx'
import CountUp from '../components/CountUp.jsx'

const TREND_DAYS = 30

export default function ChannelPage({ ch, role, onBack, onRequest, stock, ...entryProps }) {
  const c = channel(ch)
  const trend = DATES.slice(-TREND_DAYS)
  const a = aggOf(trend, ch)
  const series = trend.map((dk) => aggOf([dk], ch).gross)

  return (
    <>
      <div className="ch-bar">
        <button type="button" className="back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M13 8H4M7.5 4.5L4 8l3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Tất cả kênh
        </button>
        <button type="button" className="btn btn-secondary ch-req" onClick={onRequest}>
          Yêu cầu lấy hàng
        </button>
      </div>

      <section className="ch-hero" style={{ '--ch': `var(${c.v})` }}>
        <div className="hero-top">
          <h2>{c.name}</h2>
          <span className="hint">
            {TREND_DAYS} ngày gần nhất · phí kênh {pct(c.fee)}
          </span>
        </div>

        <dl className="hero-stats">
          <div>
            <dt>Doanh thu gộp</dt>
            <dd className="big"><CountUp value={a.gross} format={compact} /></dd>
            <dd className="sub">{money(a.gross)}</dd>
          </div>
          <div>
            <dt>Số lượng bán</dt>
            <dd className="big"><CountUp value={a.qty} /></dd>
            <dd className="sub">{a.retQty ? `${a.retQty} hoàn` : 'không có hoàn'}</dd>
          </div>
          {role === 'owner' && (
            <>
              <div>
                <dt>Doanh thu net</dt>
                <dd className="big"><CountUp value={a.net} format={compact} /></dd>
                <dd className="sub">sau phí {compact(a.fee)}</dd>
              </div>
              <div>
                <dt>Margin</dt>
                <dd className={`big ${a.margin < 0.25 ? 'is-down' : 'is-up'}`}><CountUp value={a.margin} format={pct} /></dd>
                <dd className="sub">giá vốn {compact(a.cogs)}</dd>
              </div>
            </>
          )}
        </dl>

        <div className="chart-wrap">
          <AreaOne dates={trend} series={series} color={`var(${c.v})`} />
        </div>
      </section>

      <Reveal as="section" className="card">
        <header>
          <h2>Tồn kho kênh {c.name}</h2>
          <span className="hint">Chỉ bán được trong số này. Hết thì gửi yêu cầu lấy hàng.</span>
        </header>
        <ul className="stk-list">
          {PRODUCTS.map((p) => {
            const n = stock[p.sku]?.[ch] ?? 0
            return (
              <li key={p.sku} className={n === 0 ? 'is-zero' : n < 5 ? 'is-low' : ''}>
                <span>{product(p.sku).name} · {p.variant}</span>
                <b>{n}</b>
              </li>
            )
          })}
        </ul>
      </Reveal>

      <Entry role={role} ch={ch} {...entryProps} />
    </>
  )
}
