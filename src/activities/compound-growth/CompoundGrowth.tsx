import { useState, useMemo } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatINR } from '../../utils/finance'
import {
  generateGrowthSeries,
  findGrowthCrossover,
  calculateDoublingTime,
  calculateSimpleProjection,
  formatINRCompact,
} from '../../utils/compound'
import type { GrowthDataPoint } from '../../utils/compound'

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT = { starting: 10000, monthly: 2000, rate: 10, years: 20 }

const SCENARIOS = [
  { id: 'starter', starting: 10000, monthly: 1000, rate: 8, years: 10 },
  { id: 'longTerm', starting: 10000, monthly: 5000, rate: 10, years: 25 },
  { id: 'highGrowth', starting: 10000, monthly: 2000, rate: 15, years: 20 },
  { id: 'timeExp', starting: 0, monthly: 1000, rate: 10, years: 40 },
]

const AMOUNT_PRESETS = [
  { label: '₹0', value: 0 },
  { label: '₹10K', value: 10000 },
  { label: '₹50K', value: 50000 },
  { label: '₹1L', value: 100000 },
  { label: '₹5L', value: 500000 },
]

const MONTHLY_PRESETS = [
  { label: '₹0', value: 0 },
  { label: '₹1K', value: 1000 },
  { label: '₹5K', value: 5000 },
  { label: '₹10K', value: 10000 },
  { label: '₹25K', value: 25000 },
]

const RATE_PRESETS = [
  { label: '0%', value: 0 },
  { label: '6%', value: 6 },
  { label: '8%', value: 8 },
  { label: '10%', value: 10 },
  { label: '12%', value: 12 },
  { label: '15%', value: 15 },
]

// ── Custom Tooltip ────────────────────────────────────────────────────────────

interface TooltipEntry {
  dataKey?: string
  value?: number
}
interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: number
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  const { t } = useLanguage()
  if (!active || !payload || payload.length === 0) return null
  const get = (key: string) => payload.find((p) => p.dataKey === key)?.value as number | undefined
  const compound = get('compoundValue') ?? 0
  const contrib = get('totalContribution') ?? 0
  const simple = get('simpleValue')
  const growth = Math.max(0, compound - contrib)
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-1.5 text-xs font-bold text-slate-800">{t('act4.year')} {label}</p>
      <div className="space-y-0.5 text-xs">
        <p className="text-slate-500">
          {t('act4.contributed')}: <span className="font-semibold text-slate-700">{formatINR(contrib)}</span>
        </p>
        <p className="text-indigo-600">
          {t('act4.compoundValue')}: <span className="font-bold">{formatINR(compound)}</span>
        </p>
        <p className="text-emerald-600">
          {t('act4.estimatedGrowth')}: <span className="font-semibold">{formatINR(growth)}</span>
        </p>
        {simple !== undefined && (
          <p className="text-orange-500">
            {t('act4.simpleGrowthLegend')}: <span className="font-semibold">{formatINR(simple)}</span>
          </p>
        )}
      </div>
    </div>
  )
}

// ── Slider Control ────────────────────────────────────────────────────────────

interface SliderControlProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  displayValue: string
  presets: { label: string; value: number }[]
}

function SliderControl({ label, value, min, max, step, onChange, displayValue, presets }: SliderControlProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="text-xl font-bold tabular-nums text-indigo-700">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-indigo-600"
        aria-label={label}
      />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.value)}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
              value === p.value
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
        }}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-right text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        aria-label={`${label} manual entry`}
      />
    </div>
  )
}

// ── Contribution vs Growth Bar ────────────────────────────────────────────────

function ContributionBar({ contrib, finalValue }: { contrib: number; finalValue: number }) {
  const { t } = useLanguage()
  if (finalValue <= 0) return null
  const contribPct = Math.min(100, (contrib / finalValue) * 100)
  const growthPct = Math.max(0, 100 - contribPct)
  const growth = Math.max(0, finalValue - contrib)
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
        {t('act4.yourMoneyVsGrowth')}
      </h3>
      <div className="flex h-7 w-full overflow-hidden rounded-lg bg-slate-100">
        {contribPct > 0 && (
          <div style={{ width: `${contribPct}%` }} className="h-full bg-slate-400" />
        )}
        {growthPct > 0 && (
          <div style={{ width: `${growthPct}%` }} className="h-full bg-indigo-500" />
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm bg-slate-400" />
          {t('act4.yourMoney')} {formatINR(contrib)} ({contribPct.toFixed(1)}%)
        </span>
        <span className="flex items-center gap-1.5 text-indigo-700">
          <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm bg-indigo-500" />
          {t('act4.estGrowth')} {formatINR(growth)} ({growthPct.toFixed(1)}%)
        </span>
      </div>
      <p className="mt-2 text-center text-sm font-bold text-slate-800">
        {t('act4.totalFinalValue')}: {formatINR(finalValue)}
      </p>
    </div>
  )
}

// ── Milestone Card ────────────────────────────────────────────────────────────

function MilestoneCard({ year, data }: { year: number; data: GrowthDataPoint }) {
  const { t } = useLanguage()
  const growth = Math.max(0, data.compoundValue - data.totalContribution)
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-indigo-500">
        {year} {year === 1 ? t('act4.yearSingular') : t('act4.yearPlural')}
      </p>
      <p className="text-sm font-bold tabular-nums text-slate-900">{formatINR(data.compoundValue)}</p>
      <p className="mt-0.5 text-xs text-slate-500">{t('act4.totalContributed')}: {formatINR(data.totalContribution)}</p>
      <p className="text-xs text-emerald-600">{t('act4.estimatedGrowth')}: {formatINR(growth)}</p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CompoundGrowth() {
  const { t } = useLanguage()
  const [starting, setStarting] = useState(DEFAULT.starting)
  const [monthly, setMonthly] = useState(DEFAULT.monthly)
  const [rate, setRate] = useState(DEFAULT.rate)
  const [years, setYears] = useState(DEFAULT.years)
  const [showSimple, setShowSimple] = useState(false)

  const series = useMemo(
    () => generateGrowthSeries(starting, monthly, rate, years),
    [starting, monthly, rate, years]
  )

  const finalPoint = series[series.length - 1]

  const simpleFinalValue = useMemo(
    () => (years > 0 ? calculateSimpleProjection(starting, monthly, rate, years) : starting),
    [starting, monthly, rate, years]
  )

  const crossoverYear = useMemo(
    () => findGrowthCrossover(starting, monthly, rate, years),
    [starting, monthly, rate, years]
  )

  const doublingTime = useMemo(
    () => (monthly === 0 ? calculateDoublingTime(rate) : null),
    [monthly, rate]
  )

  const milestoneYears = useMemo(() => {
    const fixed = [5, 10, 20, 30].filter((y) => y < years)
    if (fixed[fixed.length - 1] !== years) fixed.push(years)
    return fixed
  }, [years])

  const applyScenario = (s: (typeof SCENARIOS)[number]) => {
    setStarting(s.starting)
    setMonthly(s.monthly)
    setRate(s.rate)
    setYears(s.years)
  }

  const reset = () => {
    setStarting(DEFAULT.starting)
    setMonthly(DEFAULT.monthly)
    setRate(DEFAULT.rate)
    setYears(DEFAULT.years)
    setShowSimple(false)
  }

  const compoundDiff = Math.max(0, finalPoint.compoundValue - simpleFinalValue)

  return (
    <div className="space-y-6">
      {/* Headline */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">
          {t('act4.intro')}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t('act4.subIntro')}
        </p>
      </div>

      {/* Scenario presets */}
      <div>
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
          {t('act4.quickScenarios')}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => applyScenario(s)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {t(`act4.scenarios.${s.id}`)}
            </button>
          ))}
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm transition-colors hover:bg-slate-50"
          >
            {t('act4.reset')}
          </button>
        </div>
      </div>

      {/* Controls — 2×2 grid on desktop */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SliderControl
          label={t('act4.startingAmount')}
          value={starting}
          min={0}
          max={1000000}
          step={1000}
          onChange={setStarting}
          displayValue={formatINR(starting)}
          presets={AMOUNT_PRESETS}
        />
        <SliderControl
          label={t('act4.monthlyContrib')}
          value={monthly}
          min={0}
          max={100000}
          step={500}
          onChange={setMonthly}
          displayValue={formatINR(monthly)}
          presets={MONTHLY_PRESETS}
        />
        <SliderControl
          label={t('act4.annualGrowthRate')}
          value={rate}
          min={0}
          max={30}
          step={0.5}
          onChange={setRate}
          displayValue={`${rate.toFixed(1)}%`}
          presets={RATE_PRESETS}
        />
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {t('act4.timePeriod')}
            </span>
            <span className="text-2xl font-bold tabular-nums text-indigo-700">
              {years} {years === 1 ? t('act4.yearSingular') : t('act4.yearPlural')}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={40}
            step={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-indigo-600"
            aria-label={t('act4.timePeriod')}
          />
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>{t('act4.oneYear')}</span>
            <span>{t('act4.fortyYears')}</span>
          </div>
        </div>
      </div>

      {/* Live result */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-center">
        <p className="text-sm font-semibold text-indigo-600">
          {t('act4.estimatedValueAfter')} {years} {years === 1 ? t('act4.yearSingular') : t('act4.yearPlural')}
        </p>
        <p className="mt-1 text-4xl font-bold tabular-nums text-indigo-900">
          {formatINR(finalPoint.compoundValue)}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm">
          <span className="text-slate-600">
            {t('act4.totalContributed')}:{' '}
            <span className="font-semibold text-slate-800">{formatINR(finalPoint.totalContribution)}</span>
          </span>
          <span className="text-emerald-700">
            {t('act4.estimatedGrowth')}:{' '}
            <span className="font-semibold">{formatINR(finalPoint.estimatedGrowth)}</span>
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-800">{t('act4.growthOverTime')}</h3>
          <button
            type="button"
            onClick={() => setShowSimple((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
              showSimple
                ? 'border-orange-200 bg-orange-50 text-orange-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700'
            }`}
          >
            {showSimple ? t('act4.simpleGrowthShown') : t('act4.showSimpleGrowth')}
          </button>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={series} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="cgGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="year"
              tickFormatter={(v: number) => (v === 0 ? '0' : `${v}Y`)}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              tickFormatter={(v: number) => formatINRCompact(v)}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              width={62}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              formatter={(value: string) =>
                value === 'compoundValue'
                  ? t('act4.compoundValue')
                  : value === 'totalContribution'
                  ? t('act4.totalContributed')
                  : t('act4.simpleGrowthLegend')
              }
              wrapperStyle={{ fontSize: 11 }}
            />
            <Area
              type="monotone"
              dataKey="compoundValue"
              name="compoundValue"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#cgGradient)"
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="totalContribution"
              name="totalContribution"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
            />
            {showSimple && (
              <Line
                type="monotone"
                dataKey="simpleValue"
                name="simpleValue"
                stroke="#f97316"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Contribution vs Growth bar */}
      <ContributionBar
        contrib={finalPoint.totalContribution}
        finalValue={finalPoint.compoundValue}
      />

      {/* Simple vs Compound comparison */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
          {t('act4.compoundVsSimple')}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
              {t('act4.compoundValue')}
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-indigo-800">
              {formatINR(finalPoint.compoundValue)}
            </p>
          </div>
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
              {t('act4.simpleValue')}
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-orange-800">
              {formatINR(simpleFinalValue)}
            </p>
          </div>
          <div className="col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 sm:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
              {t('act4.difference')}
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-emerald-800">
              {formatINR(compoundDiff)}
            </p>
          </div>
        </div>
        {rate > 0 && (
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            {t('act4.additionalCompounding')}{' '}
            <span className="font-semibold text-slate-700">{formatINR(compoundDiff)}</span>. {t('act4.mathResult')}
          </p>
        )}
      </div>

      {/* Milestones */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
          {t('act4.milestones')}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {milestoneYears.map((y) => {
            const pt = series[y]
            if (!pt) return null
            return <MilestoneCard key={y} year={y} data={pt} />
          })}
        </div>
      </div>

      {/* Crossover + Doubling info */}
      <div className="space-y-3">
        {crossoverYear !== null ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {t('act4.crossoverYes')}{' '}
            <span className="font-bold">{crossoverYear}</span>{t('act4.crossoverYesSuffix')}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {t('act4.crossoverNo')}
          </div>
        )}
        {doublingTime !== null && rate > 0 && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            {t('act4.doublingAt')} {rate.toFixed(1)}%:{' '}
            <span className="font-bold">{doublingTime.toFixed(1)} {t('act4.yearPlural')}</span>{' '}
            <span className="text-indigo-500 text-xs">{t('act4.doublingMonthly')}</span>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        {t('act4.disclaimer')}
      </p>
    </div>
  )
}
