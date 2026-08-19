import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import {
  calculateLoanSummary,
  calculateTenureComparison,
  calculateRateComparison,
  generateAmortizationSchedule,
  aggregateAmortizationByYear,
  getFirstPaymentBreakdown,
  getLastPaymentBreakdown,
  formatINR,
} from '../../utils/loan'
import type {
  LoanSummary,
  AmortizationYear,
  TenureOption,
  RateOption,
} from '../../utils/loan'
import { useLanguage } from '../../i18n/LanguageContext'

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULTS = {
  purchasePrice: 500000,
  downPayment: 100000,
  rate: 10,
  tenureYears: 5,
}

const DOWN_PRESETS = [0, 10, 20, 30, 50]
const RATE_PRESETS = [6, 8, 10, 12, 15]
const TENURE_PRESETS = [1, 3, 5, 10, 15, 20]

const EXAMPLE_PRESETS = [
  { label: 'Example A', price: 100000, down: 20000, rate: 10, years: 3 },
  { label: 'Example B', price: 500000, down: 100000, rate: 10, years: 5 },
  { label: 'Example C', price: 1000000, down: 250000, rate: 9, years: 10 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCompact(v: number): string {
  if (!isFinite(v) || isNaN(v)) return '₹0'
  const n = Math.round(v)
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val))
}

// ── Slider ────────────────────────────────────────────────────────────────────

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
  presets?: number[]
  presetLabel?: (v: number) => string
  id: string
}

function SliderControl({
  label, value, min, max, step, display, onChange, presets, presetLabel, id,
}: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </label>
        <span className="text-base font-bold text-slate-900">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={label}
        className="h-2 w-full cursor-pointer accent-indigo-600"
      />
      {presets && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                value === p
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              {presetLabel ? presetLabel(p) : p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Summary stat card ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  highlight,
  accent,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
  accent?: 'emerald' | 'amber' | 'indigo'
}) {
  const ring =
    accent === 'emerald'
      ? 'border-emerald-200 bg-emerald-50'
      : accent === 'amber'
      ? 'border-amber-200 bg-amber-50'
      : accent === 'indigo'
      ? 'border-indigo-200 bg-indigo-50'
      : 'border-slate-100 bg-white'
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${ring}`}>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`font-bold tabular-nums ${highlight ? 'text-2xl text-indigo-700' : 'text-lg text-slate-900'}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

// ── Donut chart ───────────────────────────────────────────────────────────────

function PrincipalInterestDonut({ principal, interest }: { principal: number; interest: number }) {
  const { t } = useLanguage()
  const total = principal + interest
  if (total <= 0) return null
  const data = [
    { name: t('act6.principalBorrowed'), value: Math.round(principal), color: '#6366f1' },
    { name: t('act6.totalInterest'), value: Math.round(interest), color: '#f59e0b' },
  ]
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
        {t('act6.principalBorrowed')} vs {t('act6.totalInterest')}
      </p>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="relative h-36 w-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" barSize={28}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" hide />
              <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-3">
              <span className="h-3 w-3 flex-shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
              <span className="flex-1 text-sm text-slate-700">{d.name}</span>
              <span className="tabular-nums text-sm font-bold text-slate-900">{formatINR(d.value)}</span>
              <span className="w-12 text-right tabular-nums text-xs text-slate-400">
                {((d.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
          <div className="flex items-center gap-3 border-t border-slate-100 pt-2">
            <span className="h-3 w-3 flex-shrink-0" />
            <span className="flex-1 text-sm font-semibold text-slate-700">{t('act6.totalRepayment')}</span>
            <span className="tabular-nums text-sm font-bold text-slate-900">{formatINR(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Stacked horizontal bar ────────────────────────────────────────────────────

function RepaymentBar({ principal, interest }: { principal: number; interest: number }) {
  const total = principal + interest
  if (total <= 0) return null
  const pPct = (principal / total) * 100
  const iPct = 100 - pPct
  return (
    <div>
      <div className="mb-1 flex overflow-hidden rounded-full" style={{ height: 14 }}>
        <div style={{ width: `${pPct}%`, backgroundColor: '#6366f1' }} title={`Principal ${pPct.toFixed(0)}%`} />
        <div style={{ width: `${iPct}%`, backgroundColor: '#f59e0b' }} title={`Interest ${iPct.toFixed(0)}%`} />
      </div>
      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-indigo-500" />
          Principal {pPct.toFixed(0)}%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-amber-400" />
          Interest {iPct.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

// ── First / Last EMI breakdown ─────────────────────────────────────────────────

function EMIBreakdownCard({
  label,
  emi,
  principalPart,
  interestPart,
}: {
  label: string
  emi: number
  principalPart: number
  interestPart: number
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mb-3 text-xl font-bold text-slate-900 tabular-nums">{formatINR(emi)}</p>
      <RepaymentBar principal={principalPart} interest={interestPart} />
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-indigo-50 px-2 py-2">
          <p className="text-xs text-slate-500">Principal</p>
          <p className="font-bold text-indigo-700 tabular-nums">{formatINR(principalPart)}</p>
        </div>
        <div className="rounded-lg bg-amber-50 px-2 py-2">
          <p className="text-xs text-slate-500">Interest</p>
          <p className="font-bold text-amber-700 tabular-nums">{formatINR(interestPart)}</p>
        </div>
      </div>
    </div>
  )
}

// ── Tenure comparison ─────────────────────────────────────────────────────────

function TenureComparison({
  options,
  currentYears,
}: {
  options: TenureOption[]
  currentYears: number
}) {
  const { t } = useLanguage()
  if (options.length === 0) return null
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-bold text-slate-900">{t('act6.whatIfTenure')}</h3>
        <p className="mt-0.5 text-xs text-slate-500">Same principal and rate, different duration.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map(opt => {
          const isCurrent = opt.years === currentYears
          return (
            <div
              key={opt.years}
              className={`rounded-xl border p-4 ${
                isCurrent
                  ? 'border-indigo-300 bg-indigo-50 shadow-md'
                  : 'border-slate-100 bg-white shadow-sm'
              }`}
            >
              <p className={`mb-2 text-sm font-bold ${isCurrent ? 'text-indigo-700' : 'text-slate-700'}`}>
                {opt.years} {opt.years === 1 ? 'Year' : 'Years'}{isCurrent ? ' ←' : ''}
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('act6.monthlyEMI')}</span>
                  <span className="font-bold tabular-nums text-slate-900">{formatINR(opt.emi)}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('act6.totalInterest')}</span>
                  <span className="font-semibold tabular-nums text-amber-700">{formatINR(opt.totalInterest)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5">
                  <span className="text-slate-500">{t('act6.totalRepayment')}</span>
                  <span className="font-semibold tabular-nums text-slate-900">{formatINR(opt.totalRepayment)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {/* Total interest bar chart */}
      <div className="mt-2">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{t('act6.totalInterest')} by Tenure</p>
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white p-4">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={options.map(o => ({ name: `${o.years}y`, interest: Math.round(o.totalInterest) }))} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 10 }} width={52} />
              <Tooltip formatter={(v: unknown) => [formatINR(v as number), 'Total Interest']} />
              <Bar dataKey="interest" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                {options.map((o, i) => (
                  <Cell key={i} fill={o.years === currentYears ? '#d97706' : '#fbbf24'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ── Rate comparison ───────────────────────────────────────────────────────────

function RateComparison({
  options,
  currentRate,
}: {
  options: RateOption[]
  currentRate: number
}) {
  const { t } = useLanguage()
  if (options.length === 0) return null
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-bold text-slate-900">{t('act6.whatIfRate')}</h3>
        <p className="mt-0.5 text-xs text-slate-500">Same principal and tenure, different annual rate.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {options.map(opt => {
          const isCurrent = Math.abs(opt.rate - currentRate) < 0.001
          return (
            <div
              key={opt.rate}
              className={`rounded-xl border p-3 ${
                isCurrent
                  ? 'border-indigo-300 bg-indigo-50 shadow-md'
                  : 'border-slate-100 bg-white shadow-sm'
              }`}
            >
              <p className={`mb-2 text-sm font-bold ${isCurrent ? 'text-indigo-700' : 'text-slate-700'}`}>
                {opt.rate}%{isCurrent ? ' ←' : ''}
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('act6.monthlyEMI')}</span>
                  <span className="font-bold tabular-nums text-slate-900">{formatINR(opt.emi)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('act6.totalInterest')}</span>
                  <span className="font-semibold tabular-nums text-amber-700">{formatINR(opt.totalInterest)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Amortization table ────────────────────────────────────────────────────────

function AmortizationTable({ years, totalYears }: { years: AmortizationYear[]; totalYears: number }) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)

  // For loans > 15 years show first 3, selected milestones, last year unless expanded
  const getVisibleRows = (): AmortizationYear[] => {
    if (expanded || totalYears <= 15) return years
    const milestones = new Set([1, 2, 3, 5, 10, 15, totalYears])
    return years.filter(y => milestones.has(y.year))
  }

  const rows = getVisibleRows()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">{t('act6.annualRepayment')}</h3>
        {totalYears > 15 && (
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            {expanded ? t('act6.showFewerRows') : t('act6.viewAllYears').replace('{n}', String(totalYears))}
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[t('act6.tableYear'), t('act6.tableOpening'), t('act6.tablePrincipal'), t('act6.tableInterest'), t('act6.tableClosing')].map(h => (
                <th key={h} className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-slate-400 first:text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map(row => (
              <tr key={row.year} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-semibold text-slate-700">{t('act6.tableYear')} {row.year}</td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">{formatINR(row.openingBalance)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium text-indigo-700">{formatINR(row.principalPaid)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium text-amber-700">{formatINR(row.interestPaid)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">{formatINR(row.closingBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function EMISimulator() {
  const { t } = useLanguage()
  const [purchasePrice, setPurchasePrice] = useState(DEFAULTS.purchasePrice)
  const [downPayment, setDownPayment] = useState(DEFAULTS.downPayment)
  const [rate, setRate] = useState(DEFAULTS.rate)
  const [tenureYears, setTenureYears] = useState(DEFAULTS.tenureYears)
  const [rateInput, setRateInput] = useState(String(DEFAULTS.rate))

  // Derived / clamped values
  const safePrice = Math.max(0, purchasePrice)
  const safeDown = clamp(downPayment, 0, safePrice)

  const summary: LoanSummary = useMemo(
    () => calculateLoanSummary(safePrice, safeDown, rate, tenureYears),
    [safePrice, safeDown, rate, tenureYears]
  )

  const tenureOptions = useMemo(
    () => (summary.principal > 0 ? calculateTenureComparison(summary.principal, rate, tenureYears) : []),
    [summary.principal, rate, tenureYears]
  )

  const rateOptions = useMemo(
    () => (summary.principal > 0 ? calculateRateComparison(summary.principal, rate, summary.months) : []),
    [summary.principal, rate, summary.months]
  )

  const amortMonths = useMemo(
    () => generateAmortizationSchedule(summary.principal, rate, summary.months),
    [summary.principal, rate, summary.months]
  )

  const amortYears: AmortizationYear[] = useMemo(
    () => aggregateAmortizationByYear(amortMonths),
    [amortMonths]
  )

  const firstEMI = useMemo(
    () => getFirstPaymentBreakdown(summary.principal, rate, summary.months),
    [summary.principal, rate, summary.months]
  )

  const lastEMI = useMemo(
    () => getLastPaymentBreakdown(summary.principal, rate, summary.months),
    [summary.principal, rate, summary.months]
  )

  const downPct = safePrice > 0 ? (safeDown / safePrice) * 100 : 0
  const noBorrow = summary.principal === 0

  // Handlers
  const handlePriceChange = (val: number) => {
    const p = clamp(val, 0, 10000000)
    setPurchasePrice(p)
    if (downPayment > p) setDownPayment(p)
  }

  const handleDownChange = (val: number) => {
    setDownPayment(clamp(val, 0, safePrice))
  }

  const handleDownPctPreset = (pct: number) => {
    setDownPayment(Math.round((pct / 100) * safePrice))
  }

  const handleRateInput = (raw: string) => {
    setRateInput(raw)
    const parsed = parseFloat(raw)
    if (!isNaN(parsed)) setRate(clamp(parsed, 0, 30))
  }

  const handleRateSlider = (val: number) => {
    const rounded = Math.round(val * 10) / 10
    setRate(rounded)
    setRateInput(String(rounded))
  }

  const applyExample = (ex: typeof EXAMPLE_PRESETS[number]) => {
    setPurchasePrice(ex.price)
    setDownPayment(ex.down)
    setRate(ex.rate)
    setRateInput(String(ex.rate))
    setTenureYears(ex.years)
  }

  const reset = () => {
    setPurchasePrice(DEFAULTS.purchasePrice)
    setDownPayment(DEFAULTS.downPayment)
    setRate(DEFAULTS.rate)
    setRateInput(String(DEFAULTS.rate))
    setTenureYears(DEFAULTS.tenureYears)
  }

  return (
    <div className="space-y-8">
      {/* Headline */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t('act6.intro')}</h2>
      </div>

      {/* Example presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('act6.quickStart')}</span>
        {EXAMPLE_PRESETS.map((ex, i) => {
          const label = [t('act6.presetA'), t('act6.presetB'), t('act6.presetC')][i]
          return (
            <button
              key={ex.label}
              type="button"
              onClick={() => applyExample(ex)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {label}: {formatINR(ex.price)}
            </button>
          )
        })}
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm hover:bg-slate-50"
        >
          {t('act6.reset')}
        </button>
      </div>

      {/* ── Main two-column layout ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* Left: Controls */}
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:w-80 lg:flex-shrink-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('act6.loanParameters')}</p>

          {/* Purchase Price */}
          <div className="space-y-1.5">
            <label htmlFor="purchase-price" className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {t('act6.purchasePrice')}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
              <input
                id="purchase-price"
                type="number"
                value={purchasePrice}
                min={0}
                max={10000000}
                step={10000}
                onChange={e => handlePriceChange(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-7 pr-3 text-right text-base font-bold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <input
              type="range"
              min={10000}
              max={10000000}
              step={10000}
              value={purchasePrice}
              onChange={e => handlePriceChange(Number(e.target.value))}
              aria-label="Purchase price slider"
              className="h-2 w-full cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Down Payment */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <label htmlFor="down-payment" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t('act6.downPayment')}
              </label>
              <span className="text-xs font-semibold text-slate-500">
                {downPct.toFixed(0)}% of {formatINR(safePrice)}
              </span>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
              <input
                id="down-payment"
                type="number"
                value={safeDown}
                min={0}
                max={safePrice}
                step={5000}
                onChange={e => handleDownChange(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-7 pr-3 text-right text-base font-bold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <input
              type="range"
              min={0}
              max={safePrice}
              step={Math.max(1000, Math.round(safePrice / 100))}
              value={safeDown}
              onChange={e => handleDownChange(Number(e.target.value))}
              aria-label="Down payment slider"
              className="h-2 w-full cursor-pointer accent-indigo-600"
            />
            <div className="flex flex-wrap gap-1.5">
              {DOWN_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleDownPctPreset(p)}
                  className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                    Math.abs(downPct - p) < 1
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Loan Amount (derived) */}
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('act6.loanAmount')}</p>
            <p className="mt-1 text-xl font-bold text-indigo-700 tabular-nums">{formatINR(summary.principal)}</p>
            {noBorrow && (
              <p className="mt-1 text-xs italic text-slate-500">No borrowed amount under the current values.</p>
            )}
          </div>

          {/* Interest Rate */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <label htmlFor="rate-input" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t('act6.annualInterestRate')}
              </label>
              <div className="flex items-center gap-1">
                <input
                  id="rate-input"
                  type="number"
                  value={rateInput}
                  min={0}
                  max={30}
                  step={0.1}
                  onChange={e => handleRateInput(e.target.value)}
                  aria-label="Annual interest rate"
                  className="w-16 rounded-lg border border-slate-200 py-1 text-center text-base font-bold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <span className="text-sm font-semibold text-slate-500">%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={0.1}
              value={rate}
              onChange={e => handleRateSlider(Number(e.target.value))}
              aria-label="Interest rate slider"
              className="h-2 w-full cursor-pointer accent-indigo-600"
            />
            <div className="flex flex-wrap gap-1.5">
              {RATE_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setRate(p); setRateInput(String(p)) }}
                  className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                    rate === p
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Tenure */}
          <SliderControl
            id="tenure"
            label={t('act6.loanTenure')}
            value={tenureYears}
            min={1}
            max={30}
            step={1}
            display={`${tenureYears} ${tenureYears === 1 ? 'Year' : 'Years'} (${tenureYears * 12} months)`}
            onChange={setTenureYears}
            presets={TENURE_PRESETS}
            presetLabel={v => `${v}y`}
          />
        </div>

        {/* Right: Results */}
        <div className="flex flex-1 flex-col gap-5">

          {/* EMI hero */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-indigo-500">{t('act6.monthlyEMI')}</p>
            <p className="text-4xl font-bold tabular-nums text-indigo-700">
              {formatINR(summary.emi)}
              <span className="ml-1 text-base font-semibold text-indigo-400">/month</span>
            </p>
            {summary.months > 0 && (
              <p className="mt-1 text-xs text-indigo-500">{summary.months} monthly payments</p>
            )}
          </div>

          {/* Summary grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label={t('act6.principalBorrowed')} value={formatINR(summary.principal)} />
            <StatCard label={t('act6.totalInterest')} value={formatINR(summary.totalInterest)} accent="amber" />
            <StatCard label={t('act6.totalRepayment')} value={formatINR(summary.totalRepayment)} />
            <StatCard label={t('act6.downPayment')} value={formatINR(summary.downPayment)} />
            <StatCard label="Total Purchase Outflow" value={formatINR(summary.totalOutflow)} highlight accent="indigo" />
            {summary.principal > 0 && (
              <StatCard
                label={t('act6.interestToLoan')}
                value={`${summary.interestPct.toFixed(1)}%`}
              />
            )}
          </div>

          {/* Purchase price vs outflow distinction */}
          {summary.totalInterest > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-center">
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Purchase Price</p>
                  <p className="text-xl font-bold tabular-nums text-slate-800">{formatINR(safePrice)}</p>
                </div>
                <div className="hidden items-center justify-center text-2xl text-slate-300 sm:flex">→</div>
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total Outflow</p>
                  <p className="text-xl font-bold tabular-nums text-amber-700">{formatINR(summary.totalOutflow)}</p>
                  <p className="mt-0.5 text-xs text-amber-600">
                    Interest cost: {formatINR(summary.totalInterest)} extra
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Principal vs interest visual */}
          {!noBorrow && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <PrincipalInterestDonut
                principal={summary.principal}
                interest={summary.totalInterest}
              />
            </div>
          )}

          {/* First / Last EMI breakdown */}
          {!noBorrow && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <EMIBreakdownCard
                label="Your First EMI"
                emi={firstEMI.emi}
                principalPart={firstEMI.principal}
                interestPart={firstEMI.interest}
              />
              <EMIBreakdownCard
                label="Your Last EMI"
                emi={lastEMI.emi}
                principalPart={lastEMI.principal}
                interestPart={lastEMI.interest}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Tenure comparison ────────────────────────────────────────────────── */}
      {!noBorrow && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <TenureComparison options={tenureOptions} currentYears={tenureYears} />
        </div>
      )}

      {/* ── Rate comparison ───────────────────────────────────────────────────── */}
      {!noBorrow && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <RateComparison options={rateOptions} currentRate={rate} />
        </div>
      )}

      {/* ── Amortization table ──────────────────────────────────────────────── */}
      {amortYears.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <AmortizationTable years={amortYears} totalYears={tenureYears} />
        </div>
      )}

      {/* Disclaimer */}
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        {t('act6.disclaimer')}
      </p>
    </div>
  )
}
