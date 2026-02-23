export default function MiniChart({ data = [], color = '#6366f1', height = 60 }) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 4
  const w = 200
  const h = height

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * (w - padding * 2) + padding
    const y = h - padding - ((val - min) / range) * (h - padding * 2)
    return `${x},${y}`
  })

  const areaPoints = [
    `${padding},${h - padding}`,
    ...points,
    `${w - padding},${h - padding}`,
  ].join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <polygon points={areaPoints} fill={color} opacity="0.1" />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.length > 0 && (() => {
        const lastX = (data.length - 1) / (data.length - 1) * (w - padding * 2) + padding
        const lastY = h - padding - ((data[data.length - 1] - min) / range) * (h - padding * 2)
        return <circle cx={lastX} cy={lastY} r="3" fill={color} />
      })()}
    </svg>
  )
}
