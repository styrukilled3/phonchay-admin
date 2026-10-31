import Logo from './components/Logo.jsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CHANNELS,
  DATES,
  RECEIPTS_SEED,
  addProduct,
  channel,
  initialRequests,
  initialStock,
  initialWarehouse,
  isLocked,
  needsPrice,
  priceOf,
  setRule,
  toggleLock,
  product,
  setDayLines,
} from './data/seed.js'
import { dmy } from './lib/format.js'
import Channels from './screens/Channels.jsx'
import ChannelPage from './screens/ChannelPage.jsx'
import History from './screens/History.jsx'
import Dashboard from './screens/Dashboard.jsx'
import Products from './screens/Products.jsx'
import LockBook from './screens/LockBook.jsx'
import Restock from './screens/Restock.jsx'
import Warehouse from './screens/Warehouse.jsx'
import RequestStock from './screens/RequestStock.jsx'
import NewProduct from './screens/NewProduct.jsx'
import StockBar from './components/StockBar.jsx'
import { initialLots, putBack, takeFifo, totalFor } from './lib/lots.js'
import { clearSaved, loadSaved, save } from './lib/persist.js'

const SCREENS = [
  { id: 'dashboard', key: '04', label: 'Dashboard', short: 'Doanh thu', title: 'Doanh thu theo kênh', roles: ['owner'] },
  { id: 'entry', key: '01', label: 'Kênh bán', short: 'Kênh', title: 'ZONE SELL', roles: ['staff', 'owner'] },
  { id: 'history', key: '02', label: 'Lịch sử', short: 'Lịch sử', title: 'Lịch sử nhập', roles: ['staff', 'owner'] },
  { id: 'warehouse', key: '03', label: 'Kho tổng', short: 'Kho', title: 'Kho tổng', roles: ['staff', 'owner'] },
  { id: 'products', key: '05', label: 'Sản phẩm', short: 'SKU', title: 'Sản phẩm và bảng giá', roles: ['owner'] },
  { id: 'lock', key: '06', label: 'Chốt sổ', short: 'Chốt', title: 'Chốt sổ và audit', roles: ['owner'] },
]

const TODAY = DATES[DATES.length - 1]
const FIRST_CH = CHANNELS[0].id

// Nạp dữ liệu đã lưu (nếu có) trước khi dựng state
const SAVED = loadSaved()

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
  const [openCh, setOpenCh] = useState(null)
  const [date, setDate] = useState(TODAY)
  const [range, setRange] = useState(30)
  const [drafts, setDrafts] = useState(SAVED?.drafts ?? {})
  const [sent, setSent] = useState(SAVED?.sent ?? {})
  const [stock, setStock] = useState(SAVED?.stock ?? initialStock)
  const [wh, setWh] = useState(SAVED?.wh ?? initialWarehouse)
  const [lots, setLots] = useState(() => SAVED?.lots ?? initialLots(initialStock()))
  const [priceVer, setPriceVer] = useState(0) // bump khi owner sửa giá để vẽ lại
  const [requests, setRequests] = useState(SAVED?.requests ?? initialRequests)
  const [sentRows, setSentRows] = useState(SAVED?.sentRows ?? {}) // key ngày|kênh -> dòng đã gửi, để tính lại tồn khi gửi lại
  const [receipts, setReceipts] = useState(SAVED?.receipts ?? RECEIPTS_SEED)
  // sub: màn con. 'restock' | 'newproduct' (trong Kho tổng), 'request' (trong trang kênh); newFrom nhớ để quay lại đúng chỗ
  const [sub, setSub] = useState(null)
  const [newFrom, setNewFrom] = useState(null)
  const [toastState, setToastState] = useState(null)
  const timer = useRef(null)

  const visible = SCREENS.filter((s) => s.roles.includes(role))
  const active = visible.find((s) => s.id === screen) ?? visible[0]

  useEffect(() => {
    if (!visible.some((s) => s.id === screen)) setScreen('entry')
  }, [role, screen, visible])

  useEffect(() => () => clearTimeout(timer.current), [])

  // Spotlight của ô hành động: ghi vị trí con trỏ vào --mx/--my của ô đang trỏ
  useEffect(() => {
    const move = (e) => {
      const el = e.target.closest?.('.act-box')
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    document.addEventListener('pointermove', move, { passive: true })
    return () => document.removeEventListener('pointermove', move)
  }, [])

  // Mọi thay đổi (kể cả sửa giá, công thức kênh qua priceVer) ghi xuống trình duyệt
  useEffect(() => {
    save({ wh, stock, lots, requests, receipts, sentRows, sent, drafts })
  }, [wh, stock, lots, requests, receipts, sentRows, sent, drafts, priceVer])

  function resetAll() {
    if (!window.confirm('Xóa toàn bộ sản phẩm, tồn kho, doanh số đã nhập và làm lại từ đầu?')) return
    clearSaved()
    window.location.reload()
  }

  const toast = useCallback((message, undo) => {
    setToastState({ message, undo })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToastState(null), 4000)
  }, [])

  const key = openCh ? `${date}|${openCh}` : ''
  const rows = drafts[key] ?? []
  const setRows = (next) => setDrafts((d) => ({ ...d, [key]: next }))

  function statusOf(dk, chId) {
    if (isLocked(dk)) return 'locked'
    if (sent[`${dk}|${chId}`]) return 'sent'
    return 'draft'
  }

  function go(id) {
    setScreen(id)
    setOpenCh(null)
    setSub(null)
    window.scrollTo({ top: 0 })
  }

  function openRequest(ch) {
    setScreen('entry')
    setOpenCh(ch)
    setNewFrom(null)
    setSub('request')
    window.scrollTo({ top: 0 })
  }

  function openSub(id) {
    setNewFrom(sub)
    setSub(id)
    window.scrollTo({ top: 0 })
  }

  function confirmRestock({ rows, date: d, supplier, totalQty, totalCost }) {
    setWh((w) => {
      const next = { ...w }
      rows.forEach((r) => {
        next[r.sku] = (next[r.sku] ?? 0) + r.qty
      })
      return next
    })
    const id = `PN-${String(Number(receipts[0]?.id.slice(3) ?? 0) + 1).padStart(4, '0')}`
    setReceipts((r) => [{ id, date: d, qty: totalQty, total: totalCost }, ...r])
    setSub(null)
    window.scrollTo({ top: 0 })
    toast(`Đã nhập ${totalQty} sp vào kho tổng${supplier ? ` · ${supplier}` : ''}.`)
  }

  // list: [{ product, qty }], mỗi size một SKU
  function addProducts(list) {
    list.forEach(({ product: p }) => addProduct(p))
    setWh((w) => {
      const next = { ...w }
      list.forEach(({ product: p, qty }) => {
        next[p.sku] = qty
      })
      return next
    })
    const n = list.length
    toast(n > 1 ? `Đã tạo ${list[0].product.name} với ${n} size.` : `Đã tạo sản phẩm ${list[0].product.name} · ${list[0].product.variant}.`)
  }

  function saveProduct(list) {
    addProducts(list)
    // Tạo từ phiếu nhập thì quay lại phiếu để thêm dòng luôn
    setSub(newFrom === 'restock' ? 'restock' : null)
    setNewFrom(null)
    window.scrollTo({ top: 0 })
  }

  // Tạo sản phẩm ngay trong Kho tổng: không rời màn, SP hiện luôn trong bảng tồn
  function createInline(list) {
    addProducts(list)
  }

  function submitRequest(ch, lines) {
    const n = requests.reduce((m, r) => Math.max(m, Number(r.id.slice(3))), 0) + 1
    const id = `YC-${String(n).padStart(4, '0')}`
    setRequests((r) => [{ id, ch, date: TODAY, status: 'pending', lines }, ...r])
    toast(`Đã gửi yêu cầu ${id} cho owner.`)
  }

  function approveRequest(id) {
    const r = requests.find((x) => x.id === id)
    if (!r || !r.lines.every((l) => (wh[l.sku] ?? 0) >= l.qty)) {
      toast('Kho tổng không đủ hàng để duyệt yêu cầu này.')
      return
    }
    if (r.lines.some((l) => needsPrice(product(l.sku)))) {
      toast('Có SKU chưa có giá gốc hoặc giá vốn. Điền ở màn Sản phẩm trước.')
      return
    }
    // Chốt giá lúc chuyển kho: mỗi lần chuyển là một lô với giá kênh tại thời điểm này
    setLots((L) => {
      const next = { ...L, [r.ch]: { ...(L[r.ch] ?? {}) } }
      r.lines.forEach((l) => {
        next[r.ch][l.sku] = [...(next[r.ch][l.sku] ?? []), { qty: l.qty, price: priceOf(l.sku, r.ch) }]
      })
      return next
    })
    setWh((w) => {
      const next = { ...w }
      r.lines.forEach((l) => {
        next[l.sku] -= l.qty
      })
      return next
    })
    setStock((st) => {
      const next = { ...st }
      r.lines.forEach((l) => {
        next[l.sku] = { ...next[l.sku], [r.ch]: (next[l.sku]?.[r.ch] ?? 0) + l.qty }
      })
      return next
    })
    setRequests((rs) => rs.map((x) => (x.id === id ? { ...x, status: 'approved' } : x)))
    toast(`Đã duyệt ${id}, chuyển hàng xuống ${channel(r.ch).name}.`)
  }

  function rejectRequest(id) {
    setRequests((rs) => rs.map((x) => (x.id === id ? { ...x, status: 'rejected' } : x)))
    toast(`Đã từ chối ${id}.`)
  }

  // Tồn bán được của SKU ở kênh đang mở: tồn kênh cộng lại phần đã gửi trước đó (gửi lại thì tính lại)
  function availOf(sku) {
    const prev = (sentRows[key] ?? []).find((r) => r.sku === sku)?.qty ?? 0
    // Kênh trực tiếp bán thẳng từ kho tổng, không có tồn riêng
    if (channel(openCh).direct) return (wh[sku] ?? 0) + prev
    return (stock[sku]?.[openCh] ?? 0) + prev
  }

  // Lô của SKU ở kênh đang mở, đã hoàn phần gửi trước đó (để gửi lại thì tính lại đúng)
  function viewLots(sku) {
    const prevParts = (sentRows[key] ?? []).find((r) => r.sku === sku)?.parts ?? []
    return putBack(lots[openCh]?.[sku] ?? [], prevParts)
  }

  // Tiền của qty đơn vị theo giá lô (FIFO), chỉ owner thấy
  function lineTotal(sku, qty) {
    return totalFor(viewLots(sku), qty, priceOf(sku, openCh))
  }

  function editProduct(sku, patch) {
    Object.assign(product(sku), patch)
    setPriceVer((v) => v + 1)
  }

  function lockDay(dk) {
    toggleLock(dk)
    setPriceVer((v) => v + 1)
    toast(isLocked(dk) ? `Đã chốt ngày ${dmy(dk)}.` : `Đã mở lại ngày ${dmy(dk)}.`)
  }

  function editRule(chId, patch) {
    setRule(chId, patch)
    setPriceVer((v) => v + 1)
  }

  // Gửi ngày: lấy hàng theo lô FIFO, ghi số bán theo giá lô vào doanh thu và trừ tồn kênh
  function sendDirectDay() {
    const prev = sentRows[key] ?? []
    const next = rows
      .filter((r) => r.qty > 0)
      .map((r) => ({ sku: r.sku, qty: r.qty, price: prev.find((p) => p.sku === r.sku)?.price ?? priceOf(r.sku, openCh) }))
    const short = next.find((r) => (wh[r.sku] ?? 0) + (prev.find((p) => p.sku === r.sku)?.qty ?? 0) < r.qty)
    if (short) {
      toast(`${short.sku} không đủ ở kho tổng. Nhập hàng trước rồi gửi.`)
      return
    }
    setWh((w) => {
      const out = { ...w }
      prev.forEach((r) => {
        out[r.sku] = (out[r.sku] ?? 0) + r.qty
      })
      next.forEach((r) => {
        out[r.sku] = (out[r.sku] ?? 0) - r.qty
      })
      return out
    })
    setDayLines(date, openCh, next)
    setSentRows((m) => ({ ...m, [key]: next }))
    setSent((x) => ({ ...x, [key]: true }))
    toast(`Đã gửi ngày ${dmy(date)} · ${channel(openCh).name}, trừ thẳng kho tổng.`)
  }

  function sendDay() {
    if (channel(openCh).direct) return sendDirectDay()
    const prev = sentRows[key] ?? []
    const L = { ...(lots[openCh] ?? {}) }
    prev.forEach((r) => {
      L[r.sku] = putBack(L[r.sku] ?? [], r.parts)
    })
    const next = rows
      .filter((r) => r.qty > 0)
      .map((r) => {
        const { rest, parts } = takeFifo(L[r.sku] ?? [], r.qty)
        L[r.sku] = rest
        return { sku: r.sku, qty: r.qty, parts }
      })
    setLots((all) => ({ ...all, [openCh]: L }))
    setStock((st) => {
      const out = { ...st }
      const touch = (sku, delta) => {
        out[sku] = { ...out[sku], [openCh]: (out[sku]?.[openCh] ?? 0) + delta }
      }
      prev.forEach((r) => touch(r.sku, r.qty))
      next.forEach((r) => touch(r.sku, -r.qty))
      return out
    })
    setDayLines(
      date,
      openCh,
      next.flatMap((r) => r.parts.map((p) => ({ sku: r.sku, qty: p.qty, price: p.price }))),
    )
    setSentRows((m) => ({ ...m, [key]: next }))
    setSent((x) => ({ ...x, [key]: true }))
    toast(`Đã gửi ngày ${dmy(date)} · ${channel(openCh).name} cho owner.`)
  }

  function openChannel(id) {
    setOpenCh(id)
    window.scrollTo({ top: 0 })
  }

  const roleLabel = role === 'owner' ? 'Owner' : 'Nhân viên'
  const onChannelPage = active.id === 'entry' && openCh && sub !== 'request'
  const onRequest = active.id === 'entry' && openCh && sub === 'request'
  const inWh = active.id === 'warehouse' ? sub : null
  const title = onRequest
    ? 'Yêu cầu lấy hàng'
    : onChannelPage
      ? channel(openCh).name
      : inWh === 'restock'
        ? 'Nhập hàng'
        : inWh === 'newproduct'
          ? 'Tạo sản phẩm mới'
          : active.title
  const crumb =
    onChannelPage || onRequest
      ? `${roleLabel} · Kênh bán`
      : inWh
        ? `${roleLabel} · Kho tổng`
        : active.id === 'entry'
          ? roleLabel.toUpperCase()
          : `${roleLabel} · ${active.label}`

  return (
    <>
      <div className="shell">
        <aside className="side">
          <div className="brand">
            <Logo className="mark" size={40} />
            <span className="txt">
              <b>PHONCHAY</b>
              <span>Admin nội bộ</span>
            </span>
          </div>

          <nav className="nav" aria-label="Điều hướng chính">
            {visible.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-current={s.id === active.id ? 'page' : undefined}
                onClick={() => go(s.id)}
              >
                <span className="nav-key">{String(i + 1).padStart(2, '0')}</span>
                {s.label}
              </button>
            ))}
          </nav>

          <div className="side-stock">
            <StockBar wh={wh} onOpen={() => go('warehouse')} />
          </div>

          <div className="side-foot">
            <p className="lbl">Xem với vai trò</p>
            <RoleSwitch role={role} setRole={setRole} />
            <p className="side-note">
              Công tắc chỉ dùng khi thử. App thật chặn quyền ở database. Số nhập lưu trong trình duyệt này.
            </p>
            {role === 'owner' && (
              <button type="button" className="link-btn" onClick={resetAll}>
                Xóa toàn bộ dữ liệu
              </button>
            )}
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <div>
              <p className="crumb">{crumb}</p>
              <h1>{title}</h1>
            </div>
            <div className="actions role-mobile">
              <RoleSwitch role={role} setRole={setRole} />
            </div>
          </header>

          <main className="view">
            {active.id === 'entry' &&
              (onRequest ? (
                <RequestStock
                  ch={openCh}
                  wh={wh}
                  stock={stock}
                  requests={requests}
                  toast={toast}
                  onBack={() => setSub(null)}
                  onSubmit={submitRequest}
                />
              ) : openCh ? (
                <ChannelPage
                  ch={openCh}
                  role={role}
                  onBack={() => setOpenCh(null)}
                  onRequest={() => openSub('request')}
                  stock={stock}
                  wh={wh}
                  avail={availOf}
                  lineTotal={lineTotal}
                  date={date}
                  setDate={setDate}
                  rows={rows}
                  setRows={setRows}
                  status={statusOf(date, openCh)}
                  toast={toast}
                  onSend={sendDay}
                  onSave={() => toast(`Đã lưu nháp ${dmy(date)} · ${channel(openCh).name}.`)}
                />
              ) : (
                <Channels role={role} date={date} statusOf={statusOf} onOpen={openChannel} stock={stock} wh={wh} />
              ))}
            {active.id === 'warehouse' &&
              (inWh === 'restock' ? (
                <Restock
                  wh={wh}
                  receipts={receipts}
                  today={TODAY}
                  toast={toast}
                  onBack={() => setSub(null)}
                  onNewProduct={() => openSub('newproduct')}
                  onConfirm={confirmRestock}
                />
              ) : inWh === 'newproduct' ? (
                <NewProduct
                  toast={toast}
                  onBack={() => {
                    setSub(newFrom === 'restock' ? 'restock' : null)
                    setNewFrom(null)
                  }}
                  onSave={saveProduct}
                />
              ) : (
                <Warehouse
                  role={role}
                  onRequest={openRequest}
                  wh={wh}
                  stock={stock}
                  requests={requests}
                  onRestock={() => openSub('restock')}
                  onCreate={createInline}
                  toast={toast}
                  onApprove={approveRequest}
                  onReject={rejectRequest}
                />
              ))}
            {active.id === 'history' && <History statusOf={statusOf} role={role} />}
            {active.id === 'dashboard' && <Dashboard range={range} setRange={setRange} />}
            {active.id === 'products' && <Products onEdit={editProduct} onRule={editRule} />}
            {active.id === 'lock' && <LockBook onToggle={lockDay} />}
          </main>
        </div>
      </div>

      <nav className="botnav" aria-label="Điều hướng">
        {visible.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-current={s.id === active.id ? 'page' : undefined}
            onClick={() => go(s.id)}
          >
            <span className="ico">{String(i + 1).padStart(2, '0')}</span>
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
