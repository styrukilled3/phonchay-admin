import { CHANNELS, DATES } from '../data/seed.js'
import { aggOf } from '../lib/calc.js'
import { compact, dmy, money } from '../lib/format.js'
import { Sparkline } from '../components/Chart.jsx'
import { StatusChip } from '../components/bits.jsx'

const TREND_DAYS = 14

export default function Channels({ role, date, statusOf, onOpen }) {
  const trend = DATES.slice(-TREND_DAYS)

  // Xếp theo doanh thu gộp 14 ngày: kênh mạnh nhất lên box đầu
  const rows = CHANNELS.map((c) => ({
    c,
    today: aggOf([date], c.id),
    period: aggOf(trend, c.id),
    series: trend.map((dk) => aggOf([dk], c.id).gross),
  })).sort((a, b) => b.period.gross - a.period.gross)

  return (
    <section className="block">
      <div className="block-head">
        <h2>Chọn kênh để xem và nhập</h2>
        <span className="hint">Số trong box là {TREND_DAYS} ngày gần nhất. Ngày đang mở: {dmy(date)}.</span>
      </div>

      <div className="ch-boxes">
        {rows.map((r, i) => (
          <button
            key={r.c.id}
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
                <span className="box-v">{compact(r.period.gross)}</span>
                <span className="box-l">Doanh thu gộp {TREND_DAYS} ngày · {money(r.period.gross)}</span>
              </span>
              <Sparkline series={r.series} color={i === 0 ? 'var(--accent-ink)' : `var(${r.c.v})`} />
            </span>

            <span className="box-foot">
              <span className="box-stat">
                <span className="k">Hôm nay</span>
                <span className="v">{r.today.gross ? compact(r.today.gross) : '—'}</span>
              </span>
              <span className="box-stat">
                <span className="k">SL hôm nay</span>
                <span className="v">{r.today.qty || '—'}</span>
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
        ))}
      </div>
    </section>
  )
}
