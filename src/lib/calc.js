import { LINES } from '../data/seed.js'

// net = gross - discount - refund - fee; margin = (net - COGS) / net
export function agg(lines) {
  const o = { gross: 0, discount: 0, refund: 0, fee: 0, cogs: 0, qty: 0, retQty: 0, orders: 0 }
  for (const l of lines) {
    const amount = l.price * l.qty
    if (l.type === 'return') {
      o.refund += amount
      o.retQty += l.qty
      o.cogs -= l.cost * l.qty
    } else {
      o.gross += amount
      o.discount += l.discount
      o.qty += l.qty
      o.orders += 1
      o.cogs += l.cost * l.qty
      o.fee += Math.round(amount * l.fee)
    }
  }
  o.net = o.gross - o.discount - o.refund - o.fee
  o.profit = o.net - o.cogs
  o.margin = o.net > 0 ? o.profit / o.net : 0
  return o
}

export function linesIn(dates, chId) {
  const set = new Set(dates)
  return LINES.filter((l) => set.has(l.date) && (!chId || l.ch === chId))
}

export function aggOf(dates, chId) {
  return agg(linesIn(dates, chId))
}
