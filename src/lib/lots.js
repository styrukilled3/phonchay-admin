import { CHANNELS, PRODUCTS, priceOf } from '../data/seed.js'

// Mỗi lần chuyển kho xuống kênh là một lô: { qty, price }. Giá chốt lúc chuyển, bán theo FIFO (lô cũ trước).

export function initialLots(stock) {
  const out = {}
  CHANNELS.forEach((c) => {
    out[c.id] = {}
    PRODUCTS.forEach((p) => {
      const q = stock[p.sku]?.[c.id] ?? 0
      if (q > 0) out[c.id][p.sku] = [{ qty: q, price: priceOf(p.sku, c.id) }]
    })
  })
  return out
}

// Lấy qty từ đầu hàng đợi. short > 0 nghĩa là lô không đủ.
export function takeFifo(lots, qty) {
  const rest = []
  const parts = []
  let need = qty
  for (const l of lots) {
    if (need <= 0) {
      rest.push(l)
      continue
    }
    const t = Math.min(l.qty, need)
    parts.push({ qty: t, price: l.price })
    need -= t
    if (l.qty > t) rest.push({ ...l, qty: l.qty - t })
  }
  return { rest, parts, short: need }
}

// Trả phần đã lấy về đầu hàng đợi (gửi lại ngày thì hoàn trước rồi lấy lại)
export function putBack(lots, parts) {
  return [...parts, ...lots]
}

// Tổng tiền của qty đơn vị nếu bán theo FIFO, không đổi dữ liệu
export function totalFor(lots, qty, fallbackPrice) {
  const { parts, short } = takeFifo(lots, qty)
  return parts.reduce((s, p) => s + p.qty * p.price, 0) + short * fallbackPrice
}
