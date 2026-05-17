export function Sparkline({
  values,
  width = 80,
  height = 24,
  stroke = 'currentColor',
  fill = 'none',
}: {
  values: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
}) {
  if (values.length === 0) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const step = width / Math.max(1, values.length - 1)

  const points = values
    .map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  const lastIdx = values.length - 1
  const lastX = lastIdx * step
  const lastY = height - ((values[lastIdx] - min) / range) * height

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r={2} fill={stroke} />
    </svg>
  )
}
