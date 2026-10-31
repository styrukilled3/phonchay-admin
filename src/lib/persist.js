import { CH_RULE, LINES, PRODUCTS } from '../data/seed.js'

// Lưu mọi thứ nhập tay vào localStorage của trình duyệt để tải lại trang không mất.
// PRODUCTS, LINES, CH_RULE là module-level nên nạp ngược vào đúng mảng/đối tượng đó.
const KEY = 'phonchay-admin-v1'

export function loadSaved() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (!s) return null
    PRODUCTS.splice(0, PRODUCTS.length, ...(s.products ?? []))
    LINES.splice(0, LINES.length, ...(s.lines ?? []))
    Object.entries(s.rule ?? {}).forEach(([id, v]) => {
      if (CH_RULE[id]) Object.assign(CH_RULE[id], v)
    })
    return s
  } catch {
    return null
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ products: PRODUCTS, lines: LINES, rule: CH_RULE, ...state }))
  } catch {
    /* trình duyệt chặn lưu thì app vẫn chạy, chỉ không giữ được sau khi tải lại */
  }
}

export function clearSaved() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* bỏ qua */
  }
}
