// Logo PHONCHAY (từ logo_pc.svg): sao ngoài + sao trong. Đục lỗ bằng evenodd nên nền sau lộ ra,
// dùng được trên nền tối (currentColor) mà không cần tô sao trong bằng màu nền.
const D = 'M309.41 0 L382.46 224.8 L618.83 224.8 L427.6 363.74 L500.64 588.54 L309.41 449.6 L118.19 588.54 L191.23 363.74 L0 224.8 L236.37 224.8Z M309.41 199.16 L333.02 271.82 L409.41 271.82 L347.61 316.72 L371.22 389.37 L309.41 344.47 L247.61 389.37 L271.22 316.72 L209.41 271.82 L285.81 271.82Z'

export default function Logo({ size = 38, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={(size * 588.54) / 618.83}
      viewBox="0 0 618.83 588.54"
      fill="currentColor"
      fillRule="evenodd"
      aria-hidden="true"
    >
      <path d={D} />
    </svg>
  )
}
