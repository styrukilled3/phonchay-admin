import { CHANNELS, DATES, DAYS, LINES } from '../data/seed.js'
import { aggOf } from '../lib/calc.js'
import { compact, money, pct } from '../lib/format.js'
import { Delta, Kpi, Tag } from '../components/bits.jsx'
import CountUp from '../components/CountUp.jsx'
import { Sparkline, StackedArea } from '../components/Chart.jsx'
import Reveal from '../components/Reveal.jsx'

export default function Dashboard({ range, setRange }) {
  const dates = DATES.slice(-range)
  const prevDates = DATES.slice(-range * 2, -range)
  const cur = aggOf(dates)
  const old = prevDates.length ? aggOf(prevDates) : null

  const rows = CHANNELS.map((c) => ({ c, a: aggOf(dates, c.id) })).sort((x, y) => y.a.net - x.a.net)
  const best = rows[0]
  const worst = [...rows].sort((x, y) => x.a.margin - y.a.margin)[0]

  return (
    <>
      <Reveal as="section" className="card">
        <header>
          <h2>Khoảng thời gian</h2>
          <span className="hint">
            Dữ liệu mẫu {DAYS} ngày, {LINES.length} dòng bán.
          </span>
        </header>
        <div className="tabs" role="group" aria-label="Khoảng thời gian">
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
      </Reveal>

      <div className="kpis">
        <Kpi label="Doanh thu gộp" value={<CountUp value={cur.gross} format={compact} />} exact={money(cur.gross)} hero>
          <Delta now={cur.gross} before={old?.gross} />
        </Kpi>
        <Kpi label="Doanh thu net" value={<CountUp value={cur.net} format={compact} />} exact={money(cur.net)}>
          <Delta now={cur.net} before={old?.net} />
        </Kpi>
        <Kpi label="Margin" value={<CountUp value={cur.margin} format={pct} />}>
          <Delta now={cur.margin} before={old?.margin} points />
        </Kpi>
        <Kpi label="Sản phẩm bán" value={<CountUp value={cur.qty} />}>
          <Delta now={cur.qty} before={old?.qty} />
        </Kpi>
      </div>

      <Reveal as="section" className="card">
        <div className="chart-head">
          <h2>Doanh thu gộp theo ngày và kênh</h2>
          <div className="legend">
            {CHANNELS.map((c) => (
              <Tag key={c.id} ch={c} />
            ))}
          </div>
        </div>
        <div className="chart-wrap">
          <StackedArea dates={dates} />
        </div>
        <p className="hint">
          Các lớp chồng lên nhau, mép trên cùng là doanh thu gộp của ngày. Trỏ vào một ngày để xem tổng.
        </p>
      </Reveal>

      <Reveal as="section" className="block">
        <div className="block-head">
          <h2>5 kênh bán</h2>
          <span className="hint">Xếp theo net. Margin thấp là kênh ăn phí và hoàn nhiều.</span>
        </div>

        <div className="ch-grid">
          {rows.map((r, i) => {
            const top = i === 0
            const series = dates.map((dk) => aggOf([dk], r.c.id).gross)
            return (
              <article
                key={r.c.id}
                className={`ch-card${top ? ' is-top' : ''}`}
                style={{ '--ch': `var(${r.c.v})` }}
              >
                <div className="ch-head">
                  <span className="ch-name">{r.c.name}</span>
                  <span className="ch-share">{pct(cur.net > 0 ? r.a.net / cur.net : 0)} tổng net</span>
                </div>

                <div className="ch-main">
                  <div className="ch-net">
                    <span className="v">{compact(r.a.net)}</span>
                    <span className="l">Doanh thu net · {money(r.a.net)}</span>
                  </div>
                  <Sparkline series={series} />
                </div>

                <dl className="ch-stats">
                  <div>
                    <dt>Gộp</dt>
                    <dd>{compact(r.a.gross)}</dd>
                  </div>
                  <div>
                    <dt>Phí {pct(r.c.fee)}</dt>
                    <dd>{r.a.fee ? `−${compact(r.a.fee)}` : '—'}</dd>
                  </div>
                  <div>
                    <dt>Hoàn</dt>
                    <dd>{r.a.refund ? `−${compact(r.a.refund)}` : '—'}</dd>
                  </div>
                  <div>
                    <dt>Margin</dt>
                    <dd className={top ? '' : r.a.margin < 0.25 ? 'is-down' : 'is-up'}>
                      {pct(r.a.margin)}
                    </dd>
                  </div>
                </dl>
              </article>
            )
          })}
        </div>
      </Reveal>

      <Reveal as="section" className="card">
        <header>
          <h2>Đọc nhanh</h2>
        </header>
        <p className="small">
          <b>{best.c.name}</b> dẫn đầu về net với {money(best.a.net)} ({pct(best.a.net / cur.net)} tổng).{' '}
          <b>{worst.c.name}</b> có margin thấp nhất {pct(worst.a.margin)} vì phí kênh {pct(worst.c.fee)} và
          giá vốn ăn {pct(worst.a.cogs / Math.max(1, worst.a.net))} doanh thu net.
        </p>
        <p className="hint">
          Số trong bản demo là dữ liệu giả sinh tại chỗ, không phải doanh thu thật của PHONCHAY.
        </p>
      </Reveal>
    </>
  )
}
