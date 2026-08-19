import type { ScheduleBlock, BlockTiming } from '../../utils/schedule'
import { TOTAL_DAY_MINUTES, formatMinutes } from '../../utils/schedule'
import { useLanguage } from '../../i18n/LanguageContext'

interface DayTimelineProps {
  blocks: ScheduleBlock[]
  timings: BlockTiming[]
  totalMinutes: number
}

export function DayTimeline({ blocks, timings, totalMinutes }: DayTimelineProps) {
  const { t } = useLanguage()
  const remaining = TOTAL_DAY_MINUTES - totalMinutes

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
        {t('act2.timeline')}
      </h3>

      {/* Segmented bar */}
      <div className="flex h-7 overflow-hidden rounded-lg">
        {blocks.map((block, i) => (
          <div
            key={block.id}
            style={{
              width: `${(block.minutes / TOTAL_DAY_MINUTES) * 100}%`,
              backgroundColor: block.color,
              minWidth: block.minutes >= 30 ? '1%' : undefined,
            }}
            title={`${block.name}: ${timings[i].startTime} – ${timings[i].endTime}`}
          />
        ))}
        {remaining > 0 && (
          <div
            style={{ width: `${(remaining / TOTAL_DAY_MINUTES) * 100}%` }}
            className="bg-slate-100"
            title="Unallocated time"
          />
        )}
      </div>

      {/* Hour labels below bar */}
      <div className="relative mt-1 h-4">
        {[0, 6, 12, 18, 24].map((h) => (
          <span
            key={h}
            className="absolute text-xs text-slate-400"
            style={{
              left: `${(h / 24) * 100}%`,
              transform: h === 0 ? 'none' : h === 24 ? 'translateX(-100%)' : 'translateX(-50%)',
            }}
          >
            {h === 0 ? '12AM' : h === 12 ? '12PM' : h === 24 ? '12AM' : `${h % 12 || 12}${h < 12 ? 'AM' : 'PM'}`}
          </span>
        ))}
      </div>

      {/* Activity list */}
      {blocks.length > 0 ? (
        <div className="mt-5 divide-y divide-slate-50">
          {blocks.map((block, i) => (
            <div
              key={block.id}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ background: block.color }}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                {block.name}
              </span>
              <span className="tabular-nums text-xs text-slate-500">{timings[i].startTime}</span>
              <span className="text-xs text-slate-300">→</span>
              <span className="tabular-nums text-xs text-slate-500">{timings[i].endTime}</span>
              <span className="w-12 text-right text-xs font-semibold tabular-nums text-slate-600">
                {formatMinutes(block.minutes)}
              </span>
            </div>
          ))}
          {remaining > 0 && (
            <div className="flex items-center gap-3 py-2.5 last:pb-0">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-slate-200" />
              <span className="min-w-0 flex-1 text-sm italic text-slate-400">{t('act2.unallocated')}</span>
              <span className="w-12 text-right text-xs font-semibold tabular-nums text-slate-400">
                {formatMinutes(remaining)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-slate-400">
          {t('act2.noScheduled')}
        </p>
      )}
    </div>
  )
}
