import { useState } from 'react'
import {
  buildDefaultSchedule,
  generateId,
  getNextColor,
  getTotalMinutes,
  getRemainingMinutes,
  computeTimings,
  formatMinutes,
  TOTAL_DAY_MINUTES,
} from '../../utils/schedule'
import type { ScheduleBlock } from '../../utils/schedule'
import { DayClock } from './DayClock'
import { ScheduleBlockRow } from './ScheduleBlockRow'
import { DayTimeline } from './DayTimeline'
import { DaySummary } from './DaySummary'
import { useLanguage } from '../../i18n/LanguageContext'

const MAX_BLOCKS = 20

export function DayScheduler() {
  const { t } = useLanguage()
  const [blocks, setBlocks] = useState<ScheduleBlock[]>(buildDefaultSchedule)

  const totalMinutes = getTotalMinutes(blocks)
  const remainingMinutes = getRemainingMinutes(blocks)
  const timings = computeTimings(blocks)
  const isFull = totalMinutes >= TOTAL_DAY_MINUTES

  // ── Mutations ───────────────────────────────────────────────────────────────

  const addBlock = () => {
    if (blocks.length >= MAX_BLOCKS) return
    const newMinutes = Math.min(30, Math.floor(remainingMinutes / 15) * 15)
    if (newMinutes < 15) return
    setBlocks((prev) => [
      ...prev,
      {
        id: generateId(),
        name: 'New Activity',
        minutes: newMinutes,
        color: getNextColor(prev),
      },
    ])
  }

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }

  const updateName = (id: string, name: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, name } : b)))
  }

  const adjustMinutes = (id: string, delta: number) => {
    setBlocks((prev) => {
      const currentTotal = getTotalMinutes(prev)
      return prev.map((b) => {
        if (b.id !== id) return b
        const next = b.minutes + delta
        if (next < 15) return b
        if (currentTotal + delta > TOTAL_DAY_MINUTES) return b
        return { ...b, minutes: next }
      })
    })
  }

  const moveUp = (id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx <= 0) return prev
      const arr = [...prev]
      ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
      return arr
    })
  }

  const moveDown = (id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx < 0 || idx >= prev.length - 1) return prev
      const arr = [...prev]
      ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
      return arr
    })
  }

  const resetSchedule = () => setBlocks(buildDefaultSchedule())
  const clearDay = () => setBlocks([])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div
        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${
          isFull
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-slate-200 bg-slate-50 text-slate-700'
        }`}
      >
        <span>
          {isFull
            ? t('act2.dayComplete')
            : `${formatMinutes(totalMinutes)} ${t('act2.scheduled')} • ${formatMinutes(remainingMinutes)} ${t('act2.remaining')}`}
        </span>
        {isFull && <span className="text-emerald-600">✓</span>}
      </div>

      {/* Main grid: controls (left) + clock (right) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controls */}
        <div className="flex flex-col gap-3">
          {blocks.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
              {t('act2.noActivities')}
            </div>
          )}

          {blocks.map((block, i) => (
            <ScheduleBlockRow
              key={block.id}
              block={block}
              timing={timings[i]}
              isFirst={i === 0}
              isLast={i === blocks.length - 1}
              canIncrease={remainingMinutes >= 15}
              onUpdateName={updateName}
              onAdjustMinutes={adjustMinutes}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onDelete={deleteBlock}
            />
          ))}

          {/* Add Activity */}
          <button
            type="button"
            onClick={addBlock}
            disabled={remainingMinutes < 15 || blocks.length >= MAX_BLOCKS}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('act2.addActivity')}
          </button>

          {/* Reset / Clear */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={resetSchedule}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              {t('act2.resetSchedule')}
            </button>
            <button
              type="button"
              onClick={clearDay}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              {t('act2.clearDay')}
            </button>
          </div>
        </div>

        {/* Clock */}
        <div className="flex flex-col items-center justify-start">
          <DayClock blocks={blocks} totalMinutes={totalMinutes} />
        </div>
      </div>

      {/* Timeline */}
      <DayTimeline blocks={blocks} timings={timings} totalMinutes={totalMinutes} />

      {/* Summary */}
      <DaySummary blocks={blocks} />
    </div>
  )
}
