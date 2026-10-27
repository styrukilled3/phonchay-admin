import { useState } from 'react'
import { CHANNELS, DATES } from '../data/seed.js'
import { agg, aggOf, linesIn } from '../lib/calc.js'
import { compact, dmy, money } from '../lib/format.js'
import { Sparkline } from '../components/Chart.jsx'
import { StatusChip } from '../components/bits.jsx'
import RevenueRings from '../components/RevenueRings.jsx'
import CountUp from '../components/CountUp.jsx'
import Reveal from '../components/Reveal.jsx'
import { chUnits } from '../lib/stock.js'


export default function Channels({ role, date, statusOf, onOpen, stock }) {
  const [range, setRange] = useState(14)
  const TREND_DAYS = range
  const trend = DATES.slice(-TREND_DAYS)

  // Xếp theo doanh thu gộp 14 ngày: kênh mạnh nhất lên box đầu
  const rows = CHANNELS.map((c) => ({
    c,
    today: aggOf([date], c.id),
    period: aggOf(trend, c.id),
    series: trend.map((dk) => aggOf([dk], c.id).gross),
  })).sort((a, b) => b.period.gross - a.period.gross)

  const sum = agg(linesIn(trend))
  // Độ dài vòng so với kênh cao nhất (kênh đầu = đầy vòng), số % trong chú thích là tỷ trọng trên tổng
  const top = Math.max(1, ...rows.map((r) => r.period.gross))
  const rings = rows.map((r) => ({
    id: r.c.id,
    v: r.c.v,
    name: r.c.name,
    gross: r.period.gross,
    pct: r.period.gross / top,
    share: sum.gross ? r.period.gross / sum.gross : 0,
  }))
  const sumToday = agg(linesIn([date]))

  return (
    <section className="block">
      <div className="block-head">
        <h2>Chọn kênh để xem và nhập</h2>
        <span className="hint">Doanh thu là {TREND_DAYS} ngày gần nhất, tồn kho là tồn của kênh. Ngày đang mở: {dmy(date)}.</span>
      </div>

      <Reveal className="rev-hero">
        <div className="rev-info">
          <span className="rev-k">Tổng doanh thu mọi kênh · {TREND_DAYS} ngày</span>
          <span className="rev-big">
            <CountUp value={sum.gross} format={compact} />
          </span>
          <span className="rev-sub">
            {money(sum.gross)} · {sum.qty} sp bán · hôm nay {compact(sumToday.gross)}
          </span>

          <div className="tabs rev-tabs" role="group" aria-label="Khoảng thời gian">
            {[7, 14, 30].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={range === n}
                style={{ '--ch': 'var(--accent)' }}
                onClick={() => setRange(n)}
              >
                <span className="dot" />
                {n} ngày
              </button>
            ))}
          </div>

          <ul className="rev-legend">
            {rings.map((r) => (
              <li key={r.id} style={{ '--ch': `var(${r.v})` }}>
                <span className="sw" />
                <span className="nm">{r.name}</span>
                <span className="amt">{compact(r.gross)}</span>
                <span className="pc">{Math.round(r.share * 100)}%</span>
              </li>
            ))}
          </ul>
          <p className="rev-note">Vòng dài nhất là kênh bán nhiều nhất, các vòng còn lại so với nó. Phần trăm là tỷ trọng trên tổng.</p>
        </div>

        <RevenueRings
          rings={rings}
          total={sum.gross}
          center={(v) => (
            <>
              <span className="k">Tổng</span>
              <b>{compact(v)}</b>
              <span className="s">{sum.qty} sp bán</span>
            </>
          )}
        />
      </Reveal>

      <div className="ch-boxes">
        {rows.map((r, i) => (
          <Reveal key={r.c.id} className={`ch-cell${i === 0 ? ' is-top' : ''}`}>
          <button
            type="button"
            className={`ch-box${i === 0 ? ' is-top' : ''}`}
            style={{ '--ch': `var(${r.c.v})` }}
            onClick={() => onOpen(r.c.id)}
          >
            <span className="box-top">
              <span className="box-name">{r.c.name}</span>
              <StatusChip status={statusOf(date, r.c.id)} />
            </span>

            <span className="box-main">
              <span className="box-figs">
                <span className="box-v"><CountUp value={r.period.gross} format={compact} /></span>
                <span className="box-l">Doanh thu gộp {TREND_DAYS} ngày · {money(r.period.gross)}</span>
              </span>
              <Sparkline series={r.series} color={i === 0 ? 'var(--accent-ink)' : `var(${r.c.v})`} />
            </span>

            <span className="box-foot">
              <span className="box-stat">
                <span className="k">Hôm nay</span>
                <span className="v">{r.today.gross ? <CountUp value={r.today.gross} format={compact} /> : '—'}</span>
              </span>
              <span className="box-stat">
                <span className="k">SL hôm nay</span>
                <span className="v">{r.today.qty ? <CountUp value={r.today.qty} /> : '—'}</span>
              </span>
              <span className="box-stat">
                <span className="k">Tồn kho</span>
                <span className="v"><CountUp value={chUnits(stock, r.c.id)} /></span>
              </span>
              {role === 'owner' && (
                <span className="box-stat">
                  <span className="k">Phí kênh</span>
                  <span className="v">{(r.c.fee * 100).toFixed(0).replace('.', ',')}%</span>
                </span>
              )}
              <span className="box-go" aria-hidden="true">
                Mở kênh
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h9M8.5 4.5L12 8l-3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </span>
          </button>
          </Reveal>
        ))}
      </div>

    </section>
  )
}
