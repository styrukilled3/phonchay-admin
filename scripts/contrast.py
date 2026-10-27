"""Đo contrast WCAG của design tokens (OKLCH). Chạy: python3 scripts/contrast.py"""
import math

def oklch_to_srgb(L, C, h):
    a = C * math.cos(math.radians(h))
    b = C * math.sin(math.radians(h))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return [min(1.0, max(0.0, v)) for v in (r, g, bl)]

def luminance(rgb_linear):
    r, g, b = rgb_linear
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast(a, b):
    la, lb = luminance(oklch_to_srgb(*a)), luminance(oklch_to_srgb(*b))
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

T = {
    "bg": (0.975, 0.008, 85),
    "surface": (0.995, 0.004, 85),
    "surface-2": (0.955, 0.010, 85),
    "border-strong": (0.62, 0.015, 80),
    "ink": (0.22, 0.015, 60),
    "ink-muted": (0.45, 0.015, 60),
    "accent": (0.30, 0.04, 265),
    "white": (1.0, 0.0, 0),
    "success": (0.50, 0.12, 155),
    "warning": (0.78, 0.15, 80),
    "danger": (0.50, 0.19, 25),
    "ch-shopee": (0.60, 0.13, 255),
    "ch-tiktok": (0.60, 0.13, 160),
    "ch-web": (0.60, 0.13, 60),
    "ch-store": (0.60, 0.13, 330),
    "ch-zalo": (0.60, 0.13, 205),
}

# (foreground, background, ngưỡng tối thiểu, ghi chú)
PAIRS = [
    ("ink", "bg", 4.5, "chữ chính / nền trang"),
    ("ink", "surface", 4.5, "chữ chính / card"),
    ("ink", "surface-2", 4.5, "chữ chính / hover"),
    ("ink-muted", "bg", 4.5, "chữ phụ / nền trang"),
    ("ink-muted", "surface", 4.5, "chữ phụ / card"),
    ("ink-muted", "surface-2", 4.5, "chữ phụ / hover"),
    ("white", "accent", 4.5, "chữ trên nút chính"),
    ("ink", "warning", 4.5, "chữ trên cảnh báo"),
    ("success", "surface", 4.5, "chữ trạng thái thành công"),
    ("danger", "surface", 4.5, "chữ lỗi"),
    ("border-strong", "surface", 3.0, "viền ô nhập / control"),
    ("ch-shopee", "surface", 3.0, "màu kênh 1 (đồ họa)"),
    ("ch-tiktok", "surface", 3.0, "màu kênh 2 (đồ họa)"),
    ("ch-web", "surface", 3.0, "màu kênh 3 (đồ họa)"),
    ("ch-store", "surface", 3.0, "màu kênh 4 (đồ họa)"),
    ("ch-zalo", "surface", 3.0, "màu kênh 5 (đồ họa)"),
]

if __name__ == "__main__":
    fail = 0
    for fg, bg, need, note in PAIRS:
        r = contrast(T[fg], T[bg])
        ok = r >= need
        fail += not ok
        print(f"{'OK  ' if ok else 'FAIL'} {r:5.2f}:1 (cần {need}) {fg} / {bg}  - {note}")
    raise SystemExit(1 if fail else 0)
