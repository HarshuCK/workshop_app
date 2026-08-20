import { useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  RETIREMENT_DEFAULTS, AGE_PRESETS, INCOME_PRESETS,
  RETIREMENT_AGE_PRESETS, EXPENSE_PRESETS, PLANNING_AGE_PRESETS,
  BUFFER_PRESETS,
  parseAge, parseAmount, formatCompact, validateInputs,
  calculateRetirement, calculateAgeComparisons, calculateExpenseComparisons,
  formatINR,
} from '../../utils/retirementSavings'
import type { RetirementInputs } from '../../utils/retirementSavings'

// ── Shared primitives ────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </div>
  )
}

interface ResultCardProps {
  label: string
  value: string
  sub?: string
  accent?: 'violet' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'
  large?: boolean
}
function ResultCard({ label, value, sub, accent = 'slate', large = false }: ResultCardProps) {
  const bg: Record<string, string> = {
    violet: 'border-violet-100 bg-violet-50',
    indigo: 'border-indigo-100 bg-indigo-50',
    emerald: 'border-emerald-100 bg-emerald-50',
    amber: 'border-amber-100 bg-amber-50',
    rose: 'border-rose-100 bg-rose-50',
    slate: 'border-slate-100 bg-slate-50',
  }
  const text: Record<string, string> = {
    violet: 'text-violet-700',
    indigo: 'text-indigo-700',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    rose: 'text-rose-700',
    slate: 'text-slate-700',
  }
  return (
    <div className={`rounded-xl border p-3 ${bg[accent]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 font-bold tabular-nums ${large ? 'text-xl' : 'text-base'} ${text[accent]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

interface PresetRowProps {
  presets: { label: string; value: number }[]
  current: number
  onSelect: (v: number) => void
}
function PresetRow({ presets, current, onSelect }: PresetRowProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map(p => (
        <button
          key={p.value}
          type="button"
          onClick={() => onSelect(p.value)}
          className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors ${
            current === p.value
              ? 'border-violet-300 bg-violet-50 text-violet-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

// ── Timeline ─────────────────────────────────────────────────────────────────

interface TimelineProps {
  currentAge: number
  retirementAge: number
  planningAge: number
  yearsToSave: number
  retirementYears: number
}
function RetirementTimeline({ currentAge, retirementAge, planningAge, yearsToSave, retirementYears }: TimelineProps) {
  const { t } = useLanguage()
  return (
    <>
      {/* Mobile: vertical */}
      <div className="sm:hidden flex flex-col gap-0">
        <TimelineNode age={currentAge} bold />
        <TimelineVGap label={`${t('act3.timelineSave')} ${yearsToSave} ${t('act3.years')}`} color="bg-violet-400" />
        <TimelineNode age={retirementAge} label={t('act3.timelineRetire')} />
        <TimelineVGap label={`${t('act3.timelineUse')} ${retirementYears} ${t('act3.years')}`} color="bg-indigo-400" />
        <TimelineNode age={planningAge} label={t('act3.timelinePlan')} />
      </div>

      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-center gap-0">
        <TimelineHNode age={currentAge} bold />
        <TimelineHGap label={`${t('act3.timelineSave')} ${yearsToSave} ${t('act3.years')}`} color="bg-violet-400" />
        <TimelineHNode age={retirementAge} label={t('act3.timelineRetire')} />
        <TimelineHGap label={`${t('act3.timelineUse')} ${retirementYears} ${t('act3.years')}`} color="bg-indigo-400" />
        <TimelineHNode age={planningAge} label={t('act3.timelinePlan')} />
      </div>
    </>
  )
}

function TimelineNode({ age, label, bold }: { age: number; label?: string; bold?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-violet-200 bg-violet-50 text-sm font-bold tabular-nums ${bold ? 'border-violet-500 bg-violet-100 text-violet-800' : 'text-violet-700'}`}>
        {age}
      </div>
      {label && <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-center">{label}</span>}
    </div>
  )
}

function TimelineVGap({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 py-1 pl-5">
      <div className={`w-0.5 h-10 rounded-full ${color} opacity-40 flex-shrink-0`} />
      <span className="text-xs font-semibold text-slate-500">{label}</span>
    </div>
  )
}

function TimelineHNode({ age, label, bold }: { age: number; label?: string; bold?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-violet-200 bg-violet-50 text-sm font-bold tabular-nums ${bold ? 'border-violet-500 bg-violet-100 text-violet-800' : 'text-violet-700'}`}>
        {age}
      </div>
      {label && <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-center whitespace-nowrap">{label}</span>}
    </div>
  )
}

function TimelineHGap({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 min-w-0 px-2">
      <div className={`h-0.5 w-full rounded-full ${color} opacity-40`} />
      <span className="text-xs font-semibold text-slate-500 text-center whitespace-nowrap">{label}</span>
    </div>
  )
}

// ── Corpus progress bar ───────────────────────────────────────────────────────

interface CorpusBarProps {
  requiredCorpus: number
  existingSavings: number
  remainingCorpus: number
}
function CorpusBar({ requiredCorpus, existingSavings, remainingCorpus }: CorpusBarProps) {
  const { t } = useLanguage()
  const existingPct = requiredCorpus > 0
    ? Math.min(100, (existingSavings / requiredCorpus) * 100)
    : 0
  const remainingPct = 100 - existingPct

  return (
    <div>
      <div className="relative h-7 w-full overflow-hidden rounded-lg bg-slate-100">
        {existingPct > 0 && (
          <div
            style={{ width: `${existingPct}%` }}
            className="absolute inset-y-0 left-0 h-full bg-emerald-400 transition-all"
            title={`${t('act3.existingPortion')}: ${formatCompact(existingSavings)}`}
          />
        )}
        {remainingPct > 0 && existingPct < 100 && (
          <div
            style={{ left: `${existingPct}%`, width: `${remainingPct}%` }}
            className="absolute inset-y-0 h-full bg-violet-400"
            title={`${t('act3.stillToBuild')}: ${formatCompact(remainingCorpus)}`}
          />
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <LegendDot color="bg-emerald-400" label={`${t('act3.existingPortion')}: ${formatCompact(Math.min(existingSavings, requiredCorpus))}`} />
        <LegendDot color="bg-violet-400" label={`${t('act3.stillToBuild')}: ${formatCompact(remainingCorpus)}`} />
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-slate-600">
      <span className={`inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm ${color}`} />
      {label}
    </span>
  )
}

// ── Age comparison table ──────────────────────────────────────────────────────

interface AgeCompTableProps {
  inputs: RetirementInputs
}
function AgeComparisonTable({ inputs }: AgeCompTableProps) {
  const { t } = useLanguage()
  const rows = useMemo(() => calculateAgeComparisons(inputs), [inputs])

  if (rows.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full min-w-[500px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
              {t('act3.retireAt')}
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
              {t('act3.yearsToSaveCol')}
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
              {t('act3.durationCol')}
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
              {t('act3.corpusCol')}
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
              {t('act3.monthlyCol')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map(row => {
            const isActive = row.retirementAge === inputs.retirementAge
            return (
              <tr key={row.retirementAge} className={isActive ? 'bg-violet-50' : ''}>
                <td className={`px-4 py-2.5 font-semibold ${isActive ? 'text-violet-700' : 'text-slate-700'}`}>
                  {row.retirementAge} {isActive && <span className="ml-1 text-xs text-violet-400">◀</span>}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{row.yearsToSave} {t('act3.yearsShort')}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{row.retirementDuration} {t('act3.yearsShort')}</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-700">{formatCompact(row.requiredCorpus)}</td>
                <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${isActive ? 'text-violet-700' : 'text-slate-700'}`}>
                  {formatINR(Math.round(row.monthlySavingRequired))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Expense comparison table ──────────────────────────────────────────────────

interface ExpCompTableProps {
  inputs: RetirementInputs
}
function ExpenseComparisonTable({ inputs }: ExpCompTableProps) {
  const { t } = useLanguage()
  const rows = useMemo(() => calculateExpenseComparisons(inputs), [inputs])

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full min-w-[380px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
              {t('act3.monthlyExpenseCol')}
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
              {t('act3.corpusCol')}
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
              {t('act3.monthlyCol')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map(row => {
            const isActive = row.label === '100%'
            return (
              <tr key={row.label} className={isActive ? 'bg-violet-50' : ''}>
                <td className={`px-4 py-2.5 font-semibold ${isActive ? 'text-violet-700' : 'text-slate-700'}`}>
                  {formatINR(row.monthlyExpense)}
                  <span className="ml-1.5 text-xs font-normal text-slate-400">({row.label})</span>
                  {isActive && <span className="ml-1 text-xs text-violet-400">◀</span>}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-700">{formatCompact(row.requiredCorpus)}</td>
                <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${isActive ? 'text-violet-700' : 'text-slate-700'}`}>
                  {formatINR(Math.round(row.monthlySavingRequired))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Number input with ₹ prefix ────────────────────────────────────────────────

interface AmountFieldProps {
  id: string
  label: string
  helper?: string
  value: string
  onChange: (v: string) => void
  onBlur: (v: string) => void
  min?: number
}
function AmountField({ id, label, helper, value, onChange, onBlur, min = 0 }: AmountFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {helper && <p className="mt-0.5 text-xs text-slate-400">{helper}</p>}
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="text-base font-semibold text-slate-400">₹</span>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={e => onBlur(e.target.value)}
          min={min}
          step={1000}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
      </div>
    </div>
  )
}

interface AgeFieldProps {
  id: string
  label: string
  helper?: string
  value: string
  onChange: (v: string) => void
  onBlur: (v: string) => void
  error?: boolean
}
function AgeField({ id, label, helper, value, onChange, onBlur, error }: AgeFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {helper && <p className="mt-0.5 text-xs text-slate-400">{helper}</p>}
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={e => onBlur(e.target.value)}
        min={1}
        max={120}
        step={1}
        className={`mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-base font-bold text-slate-900 outline-none focus:ring-2 ${
          error
            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
            : 'border-slate-200 focus:border-violet-400 focus:ring-violet-100'
        }`}
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function RetirementSavings() {
  const { t } = useLanguage()
  const d = RETIREMENT_DEFAULTS

  const [currentAgeStr, setCurrentAgeStr] = useState(String(d.currentAge))
  const [monthlyIncomeStr, setMonthlyIncomeStr] = useState(String(d.monthlyIncome))
  const [existingSavingsStr, setExistingSavingsStr] = useState(String(d.existingSavings))
  const [retirementAgeStr, setRetirementAgeStr] = useState(String(d.retirementAge))
  const [monthlyExpenseStr, setMonthlyExpenseStr] = useState(String(d.monthlyExpense))
  const [planningAgeStr, setPlanningAgeStr] = useState(String(d.planningAge))
  const [bufferEnabled, setBufferEnabled] = useState(d.bufferEnabled)
  const [bufferPct, setBufferPct] = useState(d.bufferPct)

  const inputs: RetirementInputs = useMemo(() => ({
    currentAge: parseAge(currentAgeStr),
    monthlyIncome: parseAmount(monthlyIncomeStr),
    existingSavings: parseAmount(existingSavingsStr),
    retirementAge: parseAge(retirementAgeStr),
    monthlyExpense: parseAmount(monthlyExpenseStr),
    planningAge: parseAge(planningAgeStr),
    bufferEnabled,
    bufferPct,
  }), [currentAgeStr, monthlyIncomeStr, existingSavingsStr, retirementAgeStr, monthlyExpenseStr, planningAgeStr, bufferEnabled, bufferPct])

  const errors = useMemo(() => validateInputs(inputs), [inputs])
  const isValid = errors.length === 0 && inputs.currentAge > 0 && inputs.retirementAge > 0 && inputs.planningAge > 0

  const result = useMemo(() => calculateRetirement(inputs), [inputs])

  const reset = () => {
    setCurrentAgeStr(String(d.currentAge))
    setMonthlyIncomeStr(String(d.monthlyIncome))
    setExistingSavingsStr(String(d.existingSavings))
    setRetirementAgeStr(String(d.retirementAge))
    setMonthlyExpenseStr(String(d.monthlyExpense))
    setPlanningAgeStr(String(d.planningAge))
    setBufferEnabled(d.bufferEnabled)
    setBufferPct(d.bufferPct)
  }

  // ── Render ──

  return (
    <div className="space-y-6">

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── Left: Inputs ── */}
        <div className="flex flex-col gap-4">

          {/* Current Age */}
          <SectionCard title={t('act3.currentAge')}>
            <div className="mb-2">
              <PresetRow
                presets={AGE_PRESETS.map(a => ({ label: String(a), value: a }))}
                current={parseAge(currentAgeStr)}
                onSelect={v => setCurrentAgeStr(String(v))}
              />
            </div>
            <AgeField
              id="current-age"
              label={t('act3.currentAgeHelper')}
              value={currentAgeStr}
              onChange={setCurrentAgeStr}
              onBlur={v => setCurrentAgeStr(String(parseAge(v)))}
            />
          </SectionCard>

          {/* Monthly Income */}
          <SectionCard title={t('act3.monthlyIncome')}>
            <div className="mb-2">
              <PresetRow
                presets={INCOME_PRESETS}
                current={parseAmount(monthlyIncomeStr)}
                onSelect={v => setMonthlyIncomeStr(String(v))}
              />
            </div>
            <AmountField
              id="monthly-income"
              label={t('act3.monthlyIncomeHelper')}
              value={monthlyIncomeStr}
              onChange={setMonthlyIncomeStr}
              onBlur={v => setMonthlyIncomeStr(String(parseAmount(v)))}
            />
          </SectionCard>

          {/* Existing Savings */}
          <SectionCard title={t('act3.existingSavings')}>
            <AmountField
              id="existing-savings"
              label={t('act3.existingSavingsHelper')}
              value={existingSavingsStr}
              onChange={setExistingSavingsStr}
              onBlur={v => setExistingSavingsStr(String(parseAmount(v)))}
            />
          </SectionCard>

          {/* Target Retirement Age */}
          <SectionCard title={t('act3.retirementAge')}>
            <div className="mb-2">
              <PresetRow
                presets={RETIREMENT_AGE_PRESETS.map(a => ({ label: String(a), value: a }))}
                current={parseAge(retirementAgeStr)}
                onSelect={v => setRetirementAgeStr(String(v))}
              />
            </div>
            <AgeField
              id="retirement-age"
              label={t('act3.retirementAgeHelper')}
              value={retirementAgeStr}
              onChange={setRetirementAgeStr}
              onBlur={v => setRetirementAgeStr(String(parseAge(v)))}
              error={errors.includes('retirementAge')}
            />
            {errors.includes('retirementAge') && (
              <p className="mt-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700">
                {t('act3.errorRetirementAge')}
              </p>
            )}
            {isValid && (
              <p className="mt-1.5 text-xs text-slate-400">
                {result.yearsUntilRetirement} {t('act3.yearsLeft')} • {result.monthsUntilRetirement} {t('act3.monthsLeft')}
              </p>
            )}
          </SectionCard>

          {/* Monthly Expense After Retirement */}
          <SectionCard title={t('act3.monthlyExpense')}>
            <div className="mb-2">
              <PresetRow
                presets={EXPENSE_PRESETS}
                current={parseAmount(monthlyExpenseStr)}
                onSelect={v => setMonthlyExpenseStr(String(v))}
              />
            </div>
            <AmountField
              id="monthly-expense"
              label={t('act3.monthlyExpenseHelper')}
              value={monthlyExpenseStr}
              onChange={setMonthlyExpenseStr}
              onBlur={v => setMonthlyExpenseStr(String(parseAmount(v)))}
            />
          </SectionCard>

          {/* Planning Age */}
          <SectionCard title={t('act3.planningAge')}>
            <div className="mb-2">
              <PresetRow
                presets={PLANNING_AGE_PRESETS.map(a => ({ label: String(a), value: a }))}
                current={parseAge(planningAgeStr)}
                onSelect={v => setPlanningAgeStr(String(v))}
              />
            </div>
            <AgeField
              id="planning-age"
              label={t('act3.planningAgeHelper')}
              value={planningAgeStr}
              onChange={setPlanningAgeStr}
              onBlur={v => setPlanningAgeStr(String(parseAge(v)))}
              error={errors.includes('planningAge')}
            />
            {errors.includes('planningAge') && (
              <p className="mt-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700">
                {t('act3.errorPlanningAge')}
              </p>
            )}
            {isValid && (
              <p className="mt-1.5 text-xs text-slate-400">
                {result.retirementYears} {t('act3.yearsLeft')} {t('act3.afterRetirement')} • {result.retirementMonths} {t('act3.monthsLeft')}
              </p>
            )}
          </SectionCard>

          {/* Safety Buffer */}
          <SectionCard title={t('act3.safetyBuffer')}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700">{t('act3.safetyBufferHelper')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={bufferEnabled}
                onClick={() => setBufferEnabled(prev => !prev)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  bufferEnabled ? 'bg-violet-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    bufferEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {bufferEnabled && (
              <div className="mt-3 flex gap-1.5">
                {BUFFER_PRESETS.map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setBufferPct(pct)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                      bufferPct === pct
                        ? 'border-violet-300 bg-violet-50 text-violet-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700'
                    }`}
                  >
                    +{pct}%
                  </button>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Reset */}
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            {t('act3.reset')}
          </button>
        </div>

        {/* ── Right: Results ── */}
        <div className="flex flex-col gap-5">

          {/* Primary result cards */}
          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-violet-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('act3.monthlySavingRequired')}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-violet-700">
                  {isValid ? formatINR(Math.round(result.monthlySavingRequired)) : '—'}
                </p>
                {isValid && result.monthlySavingRequired > 0 && (
                  <p className="mt-0.5 text-xs text-slate-400">{t('act3.perMonth')}</p>
                )}
              </div>
              <div className="rounded-xl border border-violet-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('act3.corpusRequired')}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-violet-700">
                  {isValid ? formatCompact(result.requiredCorpus) : '—'}
                </p>
                {isValid && (
                  <p className="mt-0.5 text-xs text-slate-400">{formatINR(result.requiredCorpus)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ResultCard
                label={t('act3.yearsLeftToSave')}
                value={isValid ? `${result.yearsUntilRetirement} ${t('act3.yearsShort')}` : '—'}
                accent="slate"
              />
              <ResultCard
                label={t('act3.retirementDuration')}
                value={isValid ? `${result.retirementYears} ${t('act3.yearsShort')}` : '—'}
                accent="slate"
              />
            </div>
          </div>

          {/* Secondary cards */}
          <div className="grid grid-cols-2 gap-3">
            <ResultCard
              label={t('act3.existingSavingsLabel')}
              value={formatCompact(inputs.existingSavings)}
              accent="emerald"
            />
            <ResultCard
              label={t('act3.stillRequired')}
              value={isValid ? formatCompact(result.remainingCorpus) : '—'}
              accent={isValid && result.isAlreadyCovered ? 'emerald' : 'rose'}
            />
            <ResultCard
              label={t('act3.annualSaving')}
              value={isValid ? formatINR(Math.round(result.annualSavingRequired)) : '—'}
              accent="amber"
            />
            <ResultCard
              label={t('act3.savingsRate')}
              value={
                !isValid ? '—' :
                result.savingsRatePct === null ? t('act3.notApplicable') :
                `${Math.round(result.savingsRatePct)}%`
              }
              sub={
                result.savingsRatePct !== null && isValid
                  ? `${t('act3.ofCurrentIncome')}`
                  : undefined
              }
              accent="slate"
            />
          </div>

          {/* Warnings */}
          {isValid && !result.isAlreadyCovered && !result.isIncomeSufficient && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {t('act3.warningExceedsIncome')}
            </div>
          )}
          {isValid && result.isAlreadyCovered && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {t('act3.warningAlreadyCovered')}
            </div>
          )}

          {/* Timeline */}
          {isValid && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-400">{t('act3.timeline')}</h3>
              <RetirementTimeline
                currentAge={inputs.currentAge}
                retirementAge={inputs.retirementAge}
                planningAge={inputs.planningAge}
                yearsToSave={result.yearsUntilRetirement}
                retirementYears={result.retirementYears}
              />
            </div>
          )}

          {/* Corpus progress bar */}
          {isValid && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{t('act3.corpusProgress')}</h3>
              <p className="mb-3 text-base font-bold text-slate-700">
                {t('act3.corpusRequired')}: <span className="text-violet-700">{formatCompact(result.requiredCorpus)}</span>
              </p>
              <CorpusBar
                requiredCorpus={result.requiredCorpus}
                existingSavings={inputs.existingSavings}
                remainingCorpus={result.remainingCorpus}
              />
            </div>
          )}

          {/* Expense breakdown */}
          {isValid && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{t('act3.expenseBreakdown')}</h3>
              <div className="divide-y divide-slate-50">
                {[
                  { label: t('act3.monthlyExpenseLabel'), value: formatINR(inputs.monthlyExpense) },
                  { label: t('act3.annualExpense'), value: formatINR(inputs.monthlyExpense * 12) },
                  { label: t('act3.retirementDurationLabel'), value: `${result.retirementYears} ${t('act3.yearsShort')} / ${result.retirementMonths} ${t('act3.monthsShort')}` },
                  { label: t('act3.totalMonths'), value: String(result.retirementMonths) },
                  ...(inputs.bufferEnabled ? [
                    { label: t('act3.baseCorpus'), value: formatINR(result.baseCorpus) },
                    { label: `${t('act3.withBuffer')} (+${inputs.bufferPct}%)`, value: formatINR(result.requiredCorpus) },
                  ] : [
                    { label: t('act3.totalRequired'), value: formatINR(result.requiredCorpus) },
                  ]),
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">{row.label}</span>
                    <span className="text-sm font-semibold tabular-nums text-slate-800">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Full-width: Comparison tables ── */}
      {isValid && (
        <div className="space-y-6">

          {/* Age comparison */}
          <div>
            <h3 className="mb-1 text-sm font-bold text-slate-800">{t('act3.ageComparisonTitle')}</h3>
            <p className="mb-3 text-xs text-slate-500">{t('act3.ageComparisonSub')}</p>
            <AgeComparisonTable inputs={inputs} />
          </div>

          {/* Expense comparison */}
          <div>
            <h3 className="mb-1 text-sm font-bold text-slate-800">{t('act3.expenseComparisonTitle')}</h3>
            <p className="mb-3 text-xs text-slate-500">{t('act3.expenseComparisonSub')}</p>
            <ExpenseComparisonTable inputs={inputs} />
          </div>

        </div>
      )}

      {/* Disclaimer */}
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        {t('act3.disclaimer')}
      </p>

    </div>
  )
}
