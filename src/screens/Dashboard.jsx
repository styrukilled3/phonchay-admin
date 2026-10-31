import { CHANNELS, DATES, LINES } from '../data/seed.js'
import { aggOf } from '../lib/calc.js'
import { compact, money, pct } from '../lib/format.js'
import { Delta, Tag } from '../components/bits.jsx'
import CountUp from '../components/CountUp.jsx'
import { Sparkline, StackedArea } from '../components/Chart.jsx'
import Reveal from '../components/Reveal.jsx'
import TickBar from '../components/TickBar.jsx'
import TickRing from '../components/TickRing.jsx'

export default function Dashboard({ range, setRange }) {
  const dates = DATES.slice(-range)
  const prevDates = DATES.slice(-range * 2, -range)
  const cur = aggOf(dates)
  const old = prevDates.length ? aggOf(prevDates) : null

  const rows = CHANNELS.map((c) => ({ c, a: aggOf(dates, c.id) })).sort((x, y) => y.a.net - x.a.net)
  const best = rows[0]
  const worst = [...rows].sort((x, y) => x.a.margin - y.a.margin)[0]

  const keep = cur.gross > 0 ? cur.net / cur.gross : 0

  return (
    <>
      <Reveal className="dash-head">
        <div>
          <h2>Doanh thu</h2>
          <span className="hint">
            {LINES.length} dòng bán đã gửi.
          </span>
        </div>
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

      <div className="dash-grid">
        <div className="dash-main">
          <Reveal className="kstrip">
            <div className="kitem">
              <span className="lbl">Doanh thu net</span>
              <span className="val">
                <CountUp value={cur.net} format={compact} />
              </span>
              <Delta now={cur.net} before={old?.net} />
            </div>
            <div className="kitem">
              <span className="lbl">Margin</span>
              <span className="val">
                <CountUp value={cur.margin} format={pct} />
              </span>
              <Delta now={cur.margin} before={old?.margin} points />
            </div>
            <div className="kitem">
              <span className="lbl">Sản phẩm bán</span>
              <span className="val">
                <CountUp value={cur.qty} />
              </span>
              <Delta now={cur.qty} before={old?.qty} />
            </div>
          </Reveal>

          <Reveal as="section" className="card dchart">
            <div className="dchart-top">
              <div>
                <span className="val">
                  <CountUp value={cur.gross} format={compact} />
                </span>
                <span className="lbl">Doanh thu gộp · {money(cur.gross)}</span>
              </div>
              <Delta now={cur.gross} before={old?.gross} />
            </div>
            <div className="chart-wrap">
              <StackedArea key={range} dates={dates} />
            </div>
            <div className="chart-foot">
              <span>Đường chính là tổng mọi kênh. Trỏ vào một ngày để xem từng kênh.</span>
              <div className="legend">
                {CHANNELS.map((c) => (
                  <Tag key={c.id} ch={c} />
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <aside className="dash-rail">
          <Reveal as="section" className="card rail-card">
            <h3 className="rail-title">Tỷ trọng doanh thu net</h3>
            <TickRing
              key={range}
              items={CHANNELS.map((c) => ({ id: c.id, name: c.name, v: c.v, value: Math.max(0, aggOf(dates, c.id).net) }))}
              total={cur.net}
              label="Tổng net"
              format={compact}
            />
            <ul className="tk-legend">
              {CHANNELS.map((c) => (
                <li key={c.id} style={{ '--ch': `var(${c.v})` }}>
                  <span className="sw" />
                  <span className="nm">{c.name}</span>
                  <span className="pc">{pct(cur.net > 0 ? aggOf(dates, c.id).net / cur.net : 0)}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal as="section" className="card rail-card">
            <div className="rail-row">
              <h3 className="rail-title">Giữ lại sau phí và hoàn</h3>
              <span className="rail-num">{pct(keep)}</span>
            </div>
            <TickBar key={range} ratio={keep} label="Net trên gộp" />
            <dl className="kv">
              <div>
                <dt>Kênh dẫn đầu</dt>
                <dd>{best.c.name}</dd>
              </div>
              <div>
                <dt>Margin thấp nhất</dt>
                <dd>
                  {worst.c.name} · {pct(worst.a.margin)}
                </dd>
              </div>
              <div>
                <dt>Kỳ so sánh</dt>
                <dd>{old ? `${range} ngày trước` : '—'}</dd>
              </div>
            </dl>
          </Reveal>
        </aside>
      </div>

      <Reveal as="section" className="block">
        <div className="block-head">
          <h2>{CHANNELS.length} kênh bán</h2>
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
        {cur.net > 0 ? (
          <p className="small">
            <b>{best.c.name}</b> dẫn đầu về net với {money(best.a.net)} ({pct(best.a.net / cur.net)} tổng).{' '}
            <b>{worst.c.name}</b> có margin thấp nhất {pct(worst.a.margin)} vì phí kênh {pct(worst.c.fee)} và
            giá vốn ăn {pct(worst.a.cogs / Math.max(1, worst.a.net))} doanh thu net.
          </p>
        ) : (
          <p className="small muted">Chưa có doanh số trong {range} ngày này. Nhân viên gửi ngày bán ở mục Kênh bán thì số sẽ hiện ở đây.</p>
        )}
      </Reveal>
    </>
  )
}
