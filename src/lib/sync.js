// Đồng bộ với Supabase (bảng app_docs, xem supabase/sql/001_schema.sql).
// Dữ liệu chia 6 dòng. Nhân viên chỉ đọc/ghi 3 dòng đầu, giá vốn và phiếu nhập nằm ở dòng 'owner'.
//   catalog   sản phẩm + giá bán (không có giá vốn)
//   inventory kho tổng, tồn kênh, lô, yêu cầu lấy hàng
//   lines     dòng bán (không có giá vốn), cờ đã gửi, dòng đã gửi
//   rules     công thức giá kênh        (owner ghi)
//   locks     ngày đã chốt sổ           (owner ghi)
//   owner     giá vốn SP, giá vốn từng dòng bán, phiếu nhập (chỉ owner đọc/ghi)
import { CH_RULE, LINES, LOCKED, PRODUCTS } from '../data/seed.js'
import { restore, supabase } from './auth.js'

const lineKey = (l) => `${l.date}|${l.ch}|${l.sku}`

// Giá vốn từng dòng bán đã biết, giữ lại để tải lại dòng 'lines' không làm mất
let lineCostCache = {}

export function pack(role, s) {
  const out = {
    catalog: PRODUCTS.map((p) => {
      const { cost, ...rest } = p
      return rest
    }),
    inventory: { wh: s.wh, stock: s.stock, lots: s.lots, requests: s.requests },
    lines: {
      lines: LINES.map((l) => {
        const { cost, ...rest } = l
        return rest
      }),
      sent: s.sent,
      sentRows: s.sentRows,
    },
  }
  if (role === 'owner') {
    out.rules = JSON.parse(JSON.stringify(CH_RULE))
    out.locks = [...LOCKED].sort()
    const lineCosts = Object.fromEntries(LINES.map((l) => [lineKey(l), l.cost ?? 0]))
    lineCostCache = lineCosts
    out.owner = {
      costs: Object.fromEntries(PRODUCTS.map((p) => [p.sku, p.cost ?? 0])),
      receipts: s.receipts,
      lineCosts,
    }
  }
  return out
}

// Ghi dữ liệu tải về vào PRODUCTS, LINES, CH_RULE, LOCKED (module-level) và trả phần state của React cần đổi.
// Chỉ đụng tới những dòng có trong docs, nên dùng được cho cả tải một dòng khi conflict.
export function unpack(docs, role) {
  const d = (k) => docs[k]?.data
  const patch = {}
  const owner = role === 'owner'
  const oldCost = Object.fromEntries(PRODUCTS.map((p) => [p.sku, p.cost]))
  const costs = owner ? d('owner')?.costs ?? {} : {}

  if (d('catalog')) {
    PRODUCTS.splice(0, PRODUCTS.length, ...d('catalog').map((p) => ({ ...p, cost: owner ? costs[p.sku] ?? oldCost[p.sku] ?? 0 : 0 })))
  } else if (owner && d('owner')) {
    PRODUCTS.forEach((p) => {
      p.cost = costs[p.sku] ?? p.cost ?? 0
    })
  }

  if (d('lines')) {
    LINES.splice(0, LINES.length, ...d('lines').lines.map((l) => ({ ...l, cost: 0 })))
    patch.sent = d('lines').sent ?? {}
    patch.sentRows = d('lines').sentRows ?? {}
  }
  if (d('owner')) lineCostCache = d('owner').lineCosts ?? {}
  if (owner && (d('lines') || d('owner') || d('catalog'))) {
    const byProduct = Object.fromEntries(PRODUCTS.map((p) => [p.sku, p.cost]))
    LINES.forEach((l) => {
      l.cost = lineCostCache[lineKey(l)] ?? byProduct[l.sku] ?? 0
    })
  }

  if (d('inventory')) {
    const inv = d('inventory')
    patch.wh = inv.wh ?? {}
    patch.stock = inv.stock ?? {}
    patch.lots = inv.lots ?? {}
    patch.requests = inv.requests ?? []
  }
  if (d('rules')) {
    Object.entries(d('rules')).forEach(([id, v]) => {
      if (CH_RULE[id]) Object.assign(CH_RULE[id], v)
    })
  }
  if (d('locks')) {
    LOCKED.clear()
    d('locks').forEach((x) => LOCKED.add(x))
  }
  if (owner && d('owner')) patch.receipts = d('owner').receipts ?? []
  return patch
}

export function clearMemory() {
  PRODUCTS.splice(0, PRODUCTS.length)
  LINES.splice(0, LINES.length)
  LOCKED.clear()
  lineCostCache = {}
}

async function headers() {
  const s = await restore()
  if (!s?.access_token) throw new Error('no-session')
  return { apikey: supabase.anon, Authorization: `Bearer ${s.access_token}`, 'Content-Type': 'application/json' }
}

// -> { key: { data, rev } }
export async function pullAll() {
  const r = await fetch(`${supabase.url}/rest/v1/app_docs?select=key,data,rev`, { headers: await headers() })
  if (!r.ok) throw new Error(`pull ${r.status}`)
  const rows = await r.json()
  return Object.fromEntries(rows.map((x) => [x.key, { data: x.data, rev: Number(x.rev) }]))
}

// rev = 0: tạo mới. Trả { ok, rev } | { conflict: true }
export async function pushDoc(key, data, rev) {
  const r = await fetch(`${supabase.url}/rest/v1/rpc/save_doc`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({ p_key: key, p_data: data, p_rev: rev }),
  })
  if (r.ok) return { ok: true, rev: Number(await r.json()) }
  let msg = ''
  try {
    msg = (await r.json()).message ?? ''
  } catch {
    /* thân rỗng */
  }
  if (msg === 'conflict') return { conflict: true }
  throw new Error(`push ${r.status} ${msg}`)
}
