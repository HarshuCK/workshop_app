import type { ScheduleBlock } from '../../utils/schedule'
import { TOTAL_DAY_MINUTES, formatMinutes } from '../../utils/schedule'
import { useLanguage } from '../../i18n/LanguageContext'

const CX = 200, CY = 200, OUTER_R = 130, INNER_R = 78

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(outerR: number, innerR: number, startDeg: number, endDeg: number): string {
  const span = endDeg - startDeg
  if (span <= 0) return ''

  if (span >= 360) {
    const [p1, p2] = [polarToCartesian(CX, CY, outerR, 0), polarToCartesian(CX, CY, outerR, 180)]
    const [p3, p4] = [polarToCartesian(CX, CY, innerR, 0), polarToCartesian(CX, CY, innerR, 180)]
    return [
      `M ${p1.x} ${p1.y} A ${outerR} ${outerR} 0 1 1 ${p2.x} ${p2.y}`,
      `A ${outerR} ${outerR} 0 1 1 ${p1.x} ${p1.y}`,
      `M ${p3.x} ${p3.y} A ${innerR} ${innerR} 0 1 0 ${p4.x} ${p4.y}`,
      `A ${innerR} ${innerR} 0 1 0 ${p3.x} ${p3.y} Z`,
    ].join(' ')
  }

  const oS = polarToCartesian(CX, CY, outerR, startDeg)
  const oE = polarToCartesian(CX, CY, outerR, endDeg)
  const iS = polarToCartesian(CX, CY, innerR, startDeg)
  const iE = polarToCartesian(CX, CY, innerR, endDeg)
  const large = span > 180 ? 1 : 0

  return `M ${oS.x} ${oS.y} A ${outerR} ${outerR} 0 ${large} 1 ${oE.x} ${oE.y} L ${iE.x} ${iE.y} A ${innerR} ${innerR} 0 ${large} 0 ${iS.x} ${iS.y} Z`
}

interface DayClockProps {
  blocks: ScheduleBlock[]
  totalMinutes: number
}

const MAJOR_MARKERS = [
  { hour: 0, label: '12 AM', anchor: 'middle' },
  { hour: 6, label: '6 AM', anchor: 'start' },
  { hour: 12, label: '12 PM', anchor: 'middle' },
  { hour: 18, label: '6 PM', anchor: 'end' },
]

export function DayClock({ blocks, totalMinutes }: DayClockProps) {
  const { t } = useLanguage()
  const remainingMinutes = TOTAL_DAY_MINUTES - totalMinutes
  const allocatedDeg = (totalMinutes / TOTAL_DAY_MINUTES) * 360

  // Build segments with cumulative angles
  let cumDeg = 0
  const segments = blocks
    .filter((b) => b.minutes > 0)
    .map((block) => {
      const span = (block.minutes / TOTAL_DAY_MINUTES) * 360
      const start = cumDeg
      cumDeg += span
      return { block, start, end: cumDeg, span }
    })

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 400 400"
        className="mx-auto w-full max-w-[320px] sm:max-w-[360px]"
        aria-label="24-hour day schedule visualization"
        role="img"
      >
        {/* Minor hour tick marks (all 24 hours) */}
        {Array.from({ length: 24 }, (_, h) => {
          const angle = (h / 24) * 360
          const p1 = polarToCartesian(CX, CY, OUTER_R + 3, angle)
          const p2 = polarToCartesian(CX, CY, OUTER_R + 8, angle)
          return (
            <line
              key={h}
              x1={p1.x} y1={p1.y}
              x2={p2.x} y2={p2.y}
              stroke="#e2e8f0"
              strokeWidth="1.5"
            />
          )
        })}

        {/* Unallocated background ring */}
        {remainingMinutes > 0 && (
          <path
            d={describeArc(OUTER_R, INNER_R, allocatedDeg, 360)}
            fill="#f1f5f9"
          />
        )}

        {/* Activity segments */}
        {segments.map(({ block, start, end }) => (
          <path
            key={block.id}
            d={describeArc(OUTER_R, INNER_R, start, end)}
            fill={block.color}
            className="transition-opacity"
          />
        ))}

        {/* Separator lines between segments */}
        {segments.length >= 2 &&
          segments.map(({ block, start }) => {
            const inner = polarToCartesian(CX, CY, INNER_R, start)
            const outer = polarToCartesian(CX, CY, OUTER_R, start)
            return (
              <line
                key={`sep-${block.id}`}
                x1={inner.x} y1={inner.y}
                x2={outer.x} y2={outer.y}
                stroke="white"
                strokeWidth="1.5"
              />
            )
          })}

        {/* Separator at end of allocated (boundary to unallocated) */}
        {blocks.length > 0 && remainingMinutes > 0 && (() => {
          const inner = polarToCartesian(CX, CY, INNER_R, allocatedDeg)
          const outer = polarToCartesian(CX, CY, OUTER_R, allocatedDeg)
          return (
            <line
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke="white"
              strokeWidth="1.5"
            />
          )
        })()}

        {/* Major time markers */}
        {MAJOR_MARKERS.map(({ hour, label, anchor }) => {
          const angle = (hour / 24) * 360
          const tick1 = polarToCartesian(CX, CY, OUTER_R + 3, angle)
          const tick2 = polarToCartesian(CX, CY, OUTER_R + 14, angle)
          const labelPos = polarToCartesian(CX, CY, OUTER_R + 26, angle)
          return (
            <g key={hour}>
              <line
                x1={tick1.x} y1={tick1.y}
                x2={tick2.x} y2={tick2.y}
                stroke="#94a3b8"
                strokeWidth="2"
              />
              <text
                x={labelPos.x}
                y={labelPos.y + 4}
                textAnchor={anchor as 'middle' | 'start' | 'end'}
                fontSize="11"
                fill="#64748b"
                fontWeight="600"
              >
                {label}
              </text>
            </g>
          )
        })}

        {/* Center info */}
        <text
          x={CX} y={CY - 18}
          textAnchor="middle"
          fontSize="10"
          fill="#94a3b8"
          fontWeight="700"
          letterSpacing="2"
        >
          {t('act2.hours24')}
        </text>
        <text
          x={CX} y={CY + 4}
          textAnchor="middle"
          fontSize="20"
          fill="#0f172a"
          fontWeight="800"
        >
          {formatMinutes(totalMinutes)}
        </text>
        <text
          x={CX} y={CY + 22}
          textAnchor="middle"
          fontSize="11"
          fill="#64748b"
        >
          {totalMinutes === TOTAL_DAY_MINUTES
            ? t('act2.dayCompleteLabel')
            : `${formatMinutes(remainingMinutes)} ${t('act2.leftLabel')}`}
        </text>
      </svg>
    </div>
  )
}
