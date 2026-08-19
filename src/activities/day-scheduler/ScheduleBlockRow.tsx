import type { ScheduleBlock, BlockTiming } from '../../utils/schedule'
import { QUICK_LABELS, formatMinutes } from '../../utils/schedule'
import { useLanguage } from '../../i18n/LanguageContext'

interface ScheduleBlockRowProps {
  block: ScheduleBlock
  timing: BlockTiming
  isFirst: boolean
  isLast: boolean
  canIncrease: boolean
  onUpdateName: (id: string, name: string) => void
  onAdjustMinutes: (id: string, delta: number) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onDelete: (id: string) => void
}

const listId = (id: string) => `labels-${id}`

export function ScheduleBlockRow({
  block,
  timing,
  isFirst,
  isLast,
  canIncrease,
  onUpdateName,
  onAdjustMinutes,
  onMoveUp,
  onMoveDown,
  onDelete,
}: ScheduleBlockRowProps) {
  const { t } = useLanguage()
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      {/* Row 1: color dot + name + reorder + delete */}
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 flex-shrink-0 rounded-full"
          style={{ background: block.color }}
          aria-hidden="true"
        />

        <input
          type="text"
          list={listId(block.id)}
          value={block.name}
          onChange={(e) => onUpdateName(block.id, e.target.value)}
          maxLength={40}
          aria-label={t('act2.ariaActivityName')}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-b focus:border-slate-300"
        />
        <datalist id={listId(block.id)}>
          {QUICK_LABELS.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMoveUp(block.id)}
            disabled={isFirst}
            aria-label={t('act2.ariaMoveUp')}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(block.id)}
            disabled={isLast}
            aria-label={t('act2.ariaMoveDown')}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onDelete(block.id)}
            aria-label={`${t('act2.ariaRemove')} ${block.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Row 2: stepper + time display */}
      <div className="mt-2 flex items-center gap-2 pl-5">
        <button
          type="button"
          onClick={() => onAdjustMinutes(block.id, -15)}
          disabled={block.minutes <= 15}
          aria-label={t('act2.ariaDecrease')}
          className="flex h-8 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −15m
        </button>

        <span className="w-16 text-center text-sm font-bold tabular-nums text-slate-800">
          {formatMinutes(block.minutes)}
        </span>

        <button
          type="button"
          onClick={() => onAdjustMinutes(block.id, +15)}
          disabled={!canIncrease}
          aria-label={t('act2.ariaIncrease')}
          className="flex h-8 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +15m
        </button>

        <span className="ml-auto text-xs tabular-nums text-slate-400">
          {timing.startTime} → {timing.endTime}
        </span>
      </div>
    </div>
  )
}
