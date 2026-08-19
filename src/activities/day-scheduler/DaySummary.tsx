import type { ScheduleBlock } from '../../utils/schedule'
import { TOTAL_DAY_MINUTES, formatMinutes } from '../../utils/schedule'
import { useLanguage } from '../../i18n/LanguageContext'

interface DaySummaryProps {
  blocks: ScheduleBlock[]
}

export function DaySummary({ blocks }: DaySummaryProps) {
  const { t } = useLanguage()
  if (blocks.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
        {t('act2.yourDay')}
      </h3>

      <div className="divide-y divide-slate-50">
        {blocks.map((block) => {
          const pct = (block.minutes / TOTAL_DAY_MINUTES) * 100
          return (
            <div key={block.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span
                className="h-3 w-3 flex-shrink-0 rounded-full"
                style={{ background: block.color }}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                {block.name}
              </span>
              <span className="tabular-nums text-sm font-bold text-slate-800">
                {formatMinutes(block.minutes)}
              </span>
              <span className="w-12 text-right tabular-nums text-sm text-slate-400">
                {pct.toFixed(1)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
