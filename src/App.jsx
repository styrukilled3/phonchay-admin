import { useCallback, useEffect, useRef, useState } from 'react'
import { CHANNELS, DATES, isLocked, priceOf } from './data/seed.js'
import { dmy } from './lib/format.js'
import Entry from './screens/Entry.jsx'
import History from './screens/History.jsx'
import Dashboard from './screens/Dashboard.jsx'
import Products from './screens/Products.jsx'
import LockBook from './screens/LockBook.jsx'

const SCREENS = [
  { id: 'entry', key: '01', label: 'Nhập liệu', short: 'Nhập', title: 'Nhập doanh số', roles: ['staff', 'owner'] },
  { id: 'history', key: '02', label: 'Lịch sử', short: 'Lịch sử', title: 'Lịch sử nhập', roles: ['staff', 'owner'] },
  { id: 'dashboard', key: '03', label: 'Dashboard', short: 'Doanh thu', title: 'Doanh thu theo kênh', roles: ['owner'] },
  { id: 'products', key: '04', label: 'Sản phẩm', short: 'SKU', title: 'Sản phẩm và bảng giá', roles: ['owner'] },
  { id: 'lock', key: '05', label: 'Chốt sổ', short: 'Chốt', title: 'Chốt sổ và audit', roles: ['owner'] },
]

const TODAY = DATES[DATES.length - 1]
const FIRST_CH = CHANNELS[0].id

// Mở app ở trạng thái đang làm việc thật, không phải vỏ rỗng
const INITIAL_DRAFTS = {
  [`${TODAY}|${FIRST_CH}`]: [
    { sku: 'PC-TEE-PHO-BLK-M', qty: 4, price: priceOf('PC-TEE-PHO-BLK-M', FIRST_CH), override: false },
    { sku: 'PC-CAP-SEN-BLK-OS', qty: 2, price: priceOf('PC-CAP-SEN-BLK-OS', FIRST_CH), override: false },
  ],
}

function RoleSwitch({ role, setRole }) {
  return (
    <div className="roles">
      {[
        ['staff', 'Nhân viên'],
        ['owner', 'Owner'],
      ].map(([id, label]) => (
        <button key={id} type="button" aria-pressed={role === id} onClick={() => setRole(id)}>
          {label}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const [role, setRole] = useState('staff')
  const [screen, setScreen] = useState('entry')
  const [date, setDate] = useState(TODAY)
  const [ch, setCh] = useState(FIRST_CH)
  const [range, setRange] = useState(30)
  const [drafts, setDrafts] = useState(INITIAL_DRAFTS)
  const [sent, setSent] = useState({})
  const [toastState, setToastState] = useState(null)
  const timer = useRef(null)

  const visible = SCREENS.filter((s) => s.roles.includes(role))
  const active = visible.find((s) => s.id === screen) ?? visible[0]

  useEffect(() => {
    if (!visible.some((s) => s.id === screen)) setScreen('entry')
  }, [role, screen, visible])

  useEffect(() => () => clearTimeout(timer.current), [])

  const toast = useCallback((message, undo) => {
    setToastState({ message, undo })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToastState(null), 4000)
  }, [])

  const key = `${date}|${ch}`
  const rows = drafts[key] ?? []
  const setRows = (next) => setDrafts((d) => ({ ...d, [key]: next }))

  function statusOf(dk, chId) {
    if (isLocked(dk)) return 'locked'
    if (sent[`${dk}|${chId}`]) return 'sent'
    return 'draft'
  }
  const status = statusOf(date, ch)

  function go(id) {
    setScreen(id)
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      <div className="shell">
        <aside className="side">
          <div className="brand">
            <span className="mark" aria-hidden="true">
              PC
            </span>
            <span className="txt">
              <b>PHONCHAY</b>
              <span>Admin nội bộ</span>
            </span>
          </div>

          <nav className="nav" aria-label="Điều hướng chính">
            {visible.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-current={s.id === active.id ? 'page' : undefined}
                onClick={() => go(s.id)}
              >
                <span className="nav-key">{s.key}</span>
                {s.label}
              </button>
            ))}
          </nav>

          <div className="side-foot">
            <p className="lbl">Xem với vai trò</p>
            <RoleSwitch role={role} setRole={setRole} />
            <p className="side-note">
              Công tắc chỉ dùng cho bản demo. App thật chặn quyền ở database.
            </p>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <div>
              <p className="crumb">
                {role === 'owner' ? 'Owner' : 'Nhân viên'} · {active.label}
              </p>
              <h1>{active.title}</h1>
            </div>
            <div className="actions role-mobile">
              <RoleSwitch role={role} setRole={setRole} />
            </div>
          </header>

          <main className="view">
            {active.id === 'entry' && (
              <Entry
                role={role}
                date={date}
                setDate={setDate}
                ch={ch}
                setCh={setCh}
                rows={rows}
                setRows={setRows}
                status={status}
                toast={toast}
                onSend={() => {
                  setSent((s) => ({ ...s, [key]: true }))
                  toast(`Đã gửi ngày ${dmy(date)} · ${ch} cho owner.`)
                }}
                onSave={() => toast(`Đã lưu nháp ${dmy(date)} · ${ch}.`)}
              />
            )}
            {active.id === 'history' && <History statusOf={statusOf} />}
            {active.id === 'dashboard' && <Dashboard range={range} setRange={setRange} />}
            {active.id === 'products' && <Products />}
            {active.id === 'lock' && <LockBook />}
          </main>
        </div>
      </div>

      <nav className="botnav" aria-label="Điều hướng">
        {visible.slice(0, 5).map((s) => (
          <button
            key={s.id}
            type="button"
            aria-current={s.id === active.id ? 'page' : undefined}
            onClick={() => go(s.id)}
          >
            <span className="ico">{s.key}</span>
            {s.short}
          </button>
        ))}
      </nav>

      {toastState && (
        <div className="toast" role="status">
          <span>{toastState.message}</span>
          {toastState.undo && (
            <button
              type="button"
              onClick={() => {
                toastState.undo()
                setToastState(null)
              }}
            >
              Hoàn tác
            </button>
          )}
        </div>
      )}
    </>
  )
}
