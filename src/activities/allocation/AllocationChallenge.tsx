import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useLanguage } from '../../i18n/LanguageContext'

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_BUDGET = 100
const STEP = 5
const MAX_CUSTOM_CATEGORIES = 3

const PALETTE = [
  '#6366f1', // indigo  – Learning
  '#10b981', // emerald – Health
  '#f59e0b', // amber   – Entertainment
  '#3b82f6', // blue    – Savings
  '#8b5cf6', // violet  – Travel
  '#ec4899', // pink    – Friends / Family
  '#14b8a6', // teal    – Social Causes
  '#64748b', // slate   – Other
]

const EXTRA_COLORS = ['#f97316', '#ef4444', '#84cc16']

// ── Types ─────────────────────────────────────────────────────────────────────

interface AllocationCategory {
  id: string
  name: string
  amount: number
  color: string
  isCustom: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDefaultCategories(): AllocationCategory[] {
  return [
    { id: 'learning', name: 'Learning', amount: 0, color: PALETTE[0], isCustom: false },
    { id: 'health', name: 'Health', amount: 0, color: PALETTE[1], isCustom: false },
    { id: 'entertainment', name: 'Entertainment', amount: 0, color: PALETTE[2], isCustom: false },
    { id: 'savings', name: 'Savings', amount: 0, color: PALETTE[3], isCustom: false },
    { id: 'travel', name: 'Travel', amount: 0, color: PALETTE[4], isCustom: false },
    { id: 'family', name: 'Friends / Family', amount: 0, color: PALETTE[5], isCustom: false },
    { id: 'causes', name: 'Social Causes', amount: 0, color: PALETTE[6], isCustom: false },
    { id: 'other', name: 'Other', amount: 0, color: PALETTE[7], isCustom: false },
  ]
}

function calculateTotal(cats: AllocationCategory[]): number {
  return cats.reduce((sum, c) => sum + c.amount, 0)
}

function calculateRemaining(cats: AllocationCategory[]): number {
  return TOTAL_BUDGET - calculateTotal(cats)
}

function calculatePercentage(amount: number): number {
  return (amount / TOTAL_BUDGET) * 100
}

let _idSeq = 0
function generateId(): string {
  return `custom-${++_idSeq}`
}

function generateRandomAllocation(cats: AllocationCategory[]): AllocationCategory[] {
  const n = cats.length
  const units = new Array(n).fill(0)
  const slots = TOTAL_BUDGET / STEP // 20 slots of ₹5
  for (let i = 0; i < slots; i++) {
    units[Math.floor(Math.random() * n)]++
  }
  return cats.map((c, i) => ({ ...c, amount: units[i] * STEP }))
}

// ── Preset Scenarios ──────────────────────────────────────────────────────────

const PRESETS: { id: string; amounts: Partial<Record<string, number>> }[] = [
  {
    id: 'balanced',
    amounts: {
      learning: 15, health: 15, entertainment: 15, savings: 15,
      travel: 10, family: 10, causes: 10, other: 10,
    },
  },
  {
    id: 'experiences',
    amounts: {
      learning: 10, health: 10, entertainment: 20, savings: 10,
      travel: 30, family: 20, causes: 0, other: 0,
    },
  },
  {
    id: 'futureFocused',
    amounts: {
      learning: 25, health: 15, entertainment: 5, savings: 30,
      travel: 10, family: 10, causes: 5, other: 0,
    },
  },
]

// ── Status Bar ────────────────────────────────────────────────────────────────

function StatusBar({ allocated, remaining }: { allocated: number; remaining: number }) {
  const { t } = useLanguage()
  const isFull = remaining === 0
  const isNearFull = remaining > 0 && remaining < 10
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
        isFull
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : isNearFull
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-slate-200 bg-slate-50 text-slate-700'
      }`}
    >
      <span>
        {isFull
          ? t('act5.statusFull').replace('{n}', String(allocated))
          : t('act5.statusRemaining').replace('{n}', String(allocated)).replace('{m}', String(remaining))}
      </span>
      {isNearFull && (
        <span className="text-xs text-amber-600">{t('act5.onlyLeft').replace('{n}', String(remaining))}</span>
      )}
      {isFull && <span className="text-emerald-600">✓</span>}
    </div>
  )
}

// ── Donut Chart ───────────────────────────────────────────────────────────────

interface ChartEntry {
  name: string
  value: number
  color: string
}

function AllocationDonut({
  chartData,
  remaining,
}: {
  chartData: ChartEntry[]
  remaining: number
}) {
  const { t } = useLanguage()
  const isFull = remaining === 0
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="56%"
            outerRadius="80%"
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            stroke="#fff"
            strokeWidth={2}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown) => [`₹${value as number}`, '']}
            contentStyle={{
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Centre text overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          {isFull ? (
            <>
              <p className="text-2xl font-bold text-emerald-700">₹100</p>
              <p className="text-xs font-semibold text-emerald-600">{t('act5.fullyAllocated')}</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-slate-800">₹{remaining}</p>
              <p className="text-xs text-slate-500">{t('act5.remainingLabel')}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Category Row ──────────────────────────────────────────────────────────────

interface CategoryRowProps {
  cat: AllocationCategory
  remaining: number
  displayName: string
  onAdjust: (id: string, delta: number) => void
  onDirectInput: (id: string, raw: string) => void
  onDelete?: (id: string) => void
}

function CategoryRow({ cat, remaining, displayName, onAdjust, onDirectInput, onDelete }: CategoryRowProps) {
  const pct = calculatePercentage(cat.amount)
  const canDecrease = cat.amount > 0
  const canIncrease = remaining > 0
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span
          className="h-3 w-3 flex-shrink-0 rounded-full"
          style={{ backgroundColor: cat.color }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
          {displayName}
        </span>
        <span className="tabular-nums text-xs text-slate-400">{pct.toFixed(0)}%</span>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(cat.id)}
            aria-label={`Remove ${displayName}`}
            className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500"
          >
            ✕
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2 pl-5">
        <button
          type="button"
          onClick={() => onAdjust(cat.id, -STEP)}
          disabled={!canDecrease}
          aria-label={`Decrease ${displayName} by ₹5`}
          className="flex h-8 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −₹5
        </button>
        <input
          type="number"
          value={cat.amount}
          min={0}
          max={TOTAL_BUDGET}
          onChange={(e) => onDirectInput(cat.id, e.target.value)}
          aria-label={`${displayName} allocation in rupees`}
          className="w-14 rounded-lg border border-slate-200 bg-white py-1 text-center text-base font-bold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="button"
          onClick={() => onAdjust(cat.id, +STEP)}
          disabled={!canIncrease}
          aria-label={`Increase ${displayName} by ₹5`}
          className="flex h-8 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +₹5
        </button>
      </div>
    </div>
  )
}

// ── Result Card ───────────────────────────────────────────────────────────────

function ResultCard({ categories, getCatName }: { categories: AllocationCategory[]; getCatName: (c: AllocationCategory) => string }) {
  const { t } = useLanguage()
  const sorted = [...categories].filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount)
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-emerald-700">
        {t('act5.resultCard')}
      </h3>
      <div className="mb-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-600">
          {t('act5.largestAllocations')}
        </p>
        <div className="space-y-2">
          {sorted.slice(0, 3).map((cat, i) => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="w-4 text-xs font-bold text-slate-400">{i + 1}.</span>
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 text-sm font-semibold text-slate-800">{getCatName(cat)}</span>
              <span className="font-bold tabular-nums text-slate-900">₹{cat.amount}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-600">
          {t('act5.fullBreakdown')}
        </p>
        <div className="divide-y divide-emerald-100">
          {sorted.map((cat, i) => (
            <div
              key={cat.id}
              className="flex items-center justify-between gap-3 py-1.5"
            >
              <span className="w-5 text-xs text-slate-400">{i + 1}.</span>
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 truncate text-sm text-slate-700">{getCatName(cat)}</span>
              <span className="tabular-nums text-sm font-semibold text-slate-800">
                ₹{cat.amount}
              </span>
              <span className="w-10 text-right tabular-nums text-xs text-slate-400">
                {cat.amount}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AllocationChallenge() {
  const { t } = useLanguage()
  const [categories, setCategories] = useState<AllocationCategory[]>(makeDefaultCategories)
  const [newCatName, setNewCatName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [nameError, setNameError] = useState('')

  const allocated = useMemo(() => calculateTotal(categories), [categories])
  const remaining = useMemo(() => calculateRemaining(categories), [categories])
  const isFull = remaining === 0

  const customCount = categories.filter((c) => c.isCustom).length
  const canAddCustom = customCount < MAX_CUSTOM_CATEGORIES

  // Helper to get display name (translated for default, raw name for custom)
  const getCatName = (cat: AllocationCategory): string =>
    cat.isCustom ? cat.name : t(`act5.categories.${cat.id}`)

  const chartData = useMemo((): ChartEntry[] => {
    const pts = categories
      .filter((c) => c.amount > 0)
      .map((c) => ({ name: c.isCustom ? c.name : c.id, value: c.amount, color: c.color }))
    if (remaining > 0) pts.push({ name: t('act5.unallocated'), value: remaining, color: '#e2e8f0' })
    if (pts.length === 0) pts.push({ name: t('act5.unallocated'), value: TOTAL_BUDGET, color: '#e2e8f0' })
    return pts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, remaining])

  // ── Mutation handlers ─────────────────────────────────────────────────────

  const handleAdjust = (id: string, delta: number) => {
    setCategories((prev) => {
      const rem = calculateRemaining(prev)
      return prev.map((cat) => {
        if (cat.id !== id) return cat
        if (delta > 0) {
          const actual = Math.min(delta, rem)
          if (actual <= 0) return cat
          return { ...cat, amount: cat.amount + actual }
        }
        return { ...cat, amount: Math.max(0, cat.amount + delta) }
      })
    })
  }

  const handleDirectInput = (id: string, raw: string) => {
    const parsed = parseInt(raw, 10)
    const clamped = isNaN(parsed) ? 0 : Math.max(0, Math.min(TOTAL_BUDGET, parsed))
    setCategories((prev) => {
      const otherTotal = prev.filter((c) => c.id !== id).reduce((s, c) => s + c.amount, 0)
      const maxForThis = Math.max(0, TOTAL_BUDGET - otherTotal)
      return prev.map((cat) =>
        cat.id === id ? { ...cat, amount: Math.min(clamped, maxForThis) } : cat
      )
    })
  }

  const deleteCustomCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  const addCustomCategory = () => {
    const name = newCatName.trim().slice(0, 30)
    if (!name) { setNameError(t('act5.nameErrorRequired')); return }
    setCategories((prev) => {
      const nextColor = EXTRA_COLORS[prev.filter((c) => c.isCustom).length] ?? '#94a3b8'
      return [...prev, { id: generateId(), name, amount: 0, color: nextColor, isCustom: true }]
    })
    setNewCatName('')
    setShowAddForm(false)
    setNameError('')
  }

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setCategories(
      makeDefaultCategories().map((cat) => ({
        ...cat,
        amount: preset.amounts[cat.id] ?? 0,
      }))
    )
    setShowAddForm(false)
  }

  const resetAll = () => {
    setCategories(makeDefaultCategories())
    setShowAddForm(false)
    setNewCatName('')
    setNameError('')
  }

  const randomize = () => {
    setCategories((prev) => generateRandomAllocation(prev))
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Headline */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">
          {t('act5.intro')}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t('act5.subIntro')}
        </p>
      </div>

      {/* Status bar */}
      <StatusBar allocated={allocated} remaining={remaining} />

      {/* Main two-column layout */}
      {/* flex-col-reverse: on mobile, chart (second in DOM) appears first */}
      <div className="flex flex-col-reverse gap-5 lg:flex-row lg:items-start">

        {/* ── Left: Category controls ─────────────────────────────────────── */}
        <div className="flex flex-col gap-3 lg:flex-1">

          {/* Preset scenarios */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              {t('act5.exampleAllocations')}
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {t(`act5.presets.${p.id}`)}
                </button>
              ))}
              <button
                type="button"
                onClick={randomize}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm transition-colors hover:bg-slate-50"
              >
                {t('act5.random')}
              </button>
            </div>
          </div>

          {/* Category list */}
          <div className="space-y-2">
            {categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                remaining={remaining}
                displayName={getCatName(cat)}
                onAdjust={handleAdjust}
                onDirectInput={handleDirectInput}
                onDelete={cat.isCustom ? deleteCustomCategory : undefined}
              />
            ))}
          </div>

          {/* Add custom category */}
          {canAddCustom && (
            <div>
              {showAddForm ? (
                <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-indigo-600">
                    {t('act5.newCategoryName')}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => { setNewCatName(e.target.value); setNameError('') }}
                      onKeyDown={(e) => { if (e.key === 'Enter') addCustomCategory() }}
                      placeholder={t('act5.newCategoryPlaceholder')}
                      maxLength={30}
                      aria-label={t('act5.newCategoryName')}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      onClick={addCustomCategory}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      {t('act5.add')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddForm(false); setNewCatName(''); setNameError('') }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      {t('act5.cancel')}
                    </button>
                  </div>
                  {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  {t('act5.addCategory')}
                  <span className="text-xs font-normal text-slate-400">
                    ({MAX_CUSTOM_CATEGORIES - customCount} left)
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Reset */}
          <button
            type="button"
            onClick={resetAll}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            {t('act5.resetAllocation')}
          </button>
        </div>

        {/* ── Right: Donut + Summary ──────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-5 lg:w-72 lg:flex-shrink-0">
          <AllocationDonut chartData={chartData} remaining={remaining} />

          {/* Allocation summary */}
          {allocated > 0 && (
            <div className="w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                {t('act5.breakdown')}
              </h3>
              <div className="divide-y divide-slate-50">
                {categories
                  .filter((c) => c.amount > 0)
                  .sort((a, b) => b.amount - a.amount)
                  .map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
                    >
                      <span
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                        {getCatName(cat)}
                      </span>
                      <span className="tabular-nums text-sm font-bold text-slate-800">
                        ₹{cat.amount}
                      </span>
                      <span className="w-9 text-right tabular-nums text-xs text-slate-400">
                        {cat.amount}%
                      </span>
                    </div>
                  ))}
                {remaining > 0 && (
                  <div className="flex items-center gap-2.5 py-2 last:pb-0">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-slate-200" />
                    <span className="min-w-0 flex-1 text-sm italic text-slate-400">
                      {t('act5.unallocated')}
                    </span>
                    <span className="tabular-nums text-sm font-bold text-slate-400">
                      ₹{remaining}
                    </span>
                    <span className="w-9 text-right tabular-nums text-xs text-slate-400">
                      {remaining}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Result card — shown when fully allocated */}
      {isFull && <ResultCard categories={categories} getCatName={getCatName} />}

      {/* Disclaimer */}
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        {t('act5.disclaimer')}
      </p>
    </div>
  )
}
