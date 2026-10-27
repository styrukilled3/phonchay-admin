const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

// 1250000 -> "1.250.000 ₫"
export function formatVND(n) {
  return vnd.format(n)
}

// Date | 'YYYY-MM-DD' -> "27/10/2026"
export function formatDate(value) {
  const d = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}
