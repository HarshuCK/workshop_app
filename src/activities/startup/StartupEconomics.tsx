import { useState, useMemo } from 'react'
import { RotateCcw } from 'lucide-react'
import { formatINR } from '../../utils/finance'
import {
  calculate,
  calculatePriceScenarios,
  calculateCustomerScaleScenarios,
  calculateCostScenarios,
} from '../../utils/unitEconomics'
import type { UnitEconomicsInputs } from '../../utils/unitEconomics'

// ── Presets ───────────────────────────────────────────────────────────────────

interface Preset {
  label: string
  inputs: UnitEconomicsInputs
}

const PRESETS: Preset[] = [
  {
    label: 'Subscription Example',
    inputs: {
      price: 499,
      customers: 1000,
      variableCost: 120,
      fixedCosts: 200000,
      marketingSpend: 100000,
      cac: 300,
      newCustomers: 300,
      churnRate: 5,
    },
  },
  {
    label: 'Low-Price / High-Volume',
    inputs: {
      price: 199,
      customers: 5000,
      variableCost: 60,
      fixedCosts: 400000,
      marketingSpend: 200000,
      cac: 150,
      newCustomers: 1000,
      churnRate: 8,
    },
  },
  {
    label: 'Premium Example',
    inputs: {
      price: 1999,
      customers: 300,
      variableCost: 300,
      fixedCosts: 250000,
      marketingSpend: 100000,
      cac: 1000,
      newCustomers: 100,
      churnRate: 3,
    },
  },
]

const DEFAULT_INPUTS: UnitEconomicsInputs = PRESETS[0].inputs

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  return formatINR(v)
}

function fmtCompact(v: number): string {
  if (Math.abs(v) >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(1)} L`
  return formatINR(v)
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

// ── NumberInput ───────────────────────────────────────────────────────────────

function NumberInput({
  id,
  label,
  value,
  onChange,
  min = 0,
  max,
  prefix,
  suffix,
  hint,
}: {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  prefix?: string
  suffix?: string
  hint?: string
}) {
  const [raw, setRaw] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const s = e.target.value
    setRaw(s)
    const parsed = parseFloat(s.replace(/,/g, ''))
    if (!isNaN(parsed)) {
      const clamped = max !== undefined ? clamp(parsed, min, max) : Math.max(min, parsed)
      onChange(clamped)
    }
  }

  function handleBlur() {
    setRaw(null)
  }

  const displayValue = raw !== null ? raw : String(value)

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-1">
        {prefix && (
          <span className="text-sm font-medium text-slate-400 select-none">{prefix}</span>
        )}
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {suffix && (
          <span className="text-sm font-medium text-slate-400 select-none">{suffix}</span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-400 leading-snug">{hint}</p>}
    </div>
  )
}

// ── PresetButtons ─────────────────────────────────────────────────────────────

function PresetButtons({
  activeLabel,
  onSelect,
}: {
  activeLabel: string | null
  onSelect: (p: Preset) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map(p => (
        <button
          key={p.label}
          onClick={() => onSelect(p)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeLabel === p.label
              ? 'border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  positive,
  negative,
  neutral = false,
}: {
  label: string
  value: string
  sub?: string
  positive?: boolean
  negative?: boolean
  neutral?: boolean
}) {
  const colorClass =
    positive && !neutral
      ? 'text-emerald-700'
      : negative && !neutral
      ? 'text-red-600'
      : 'text-slate-800'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
        {label}
      </div>
      <div className={`text-xl font-extrabold tabular-nums leading-tight ${colorClass}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── BusinessFlow ──────────────────────────────────────────────────────────────

function FlowRow({
  label,
  value,
  isSubtraction,
  isResult,
  positive,
  negative,
}: {
  label: string
  value: number
  isSubtraction?: boolean
  isResult?: boolean
  positive?: boolean
  negative?: boolean
}) {
  const valueColor = isResult
    ? positive
      ? 'text-emerald-700'
      : negative
      ? 'text-red-600'
      : 'text-slate-700'
    : 'text-slate-700'

  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 ${
        isResult ? 'rounded-xl bg-slate-50 border border-slate-200 font-bold' : ''
      }`}
    >
      <span className={`text-sm ${isResult ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
        {isSubtraction && <span className="mr-1 text-slate-400">−</span>}
        {label}
      </span>
      <span className={`text-sm font-bold tabular-nums ${valueColor}`}>
        {isSubtraction ? `−${fmt(value)}` : fmt(value)}
      </span>
    </div>
  )
}

function Arrow() {
  return (
    <div className="flex justify-center py-0.5 text-slate-300 select-none" aria-hidden="true">
      ↓
    </div>
  )
}

function BusinessFlow({
  revenue,
  variableCosts,
  grossProfit,
  fixedCosts,
  marketingSpend,
  operatingResult,
}: {
  revenue: number
  variableCosts: number
  grossProfit: number
  fixedCosts: number
  marketingSpend: number
  operatingResult: number
}) {
  const isProfit = operatingResult >= 0
  const isLoss = operatingResult < 0

  return (
    <div className="space-y-0.5">
      <FlowRow label="Monthly Revenue" value={revenue} />
      <Arrow />
      <FlowRow label="Variable Costs" value={variableCosts} isSubtraction />
      <Arrow />
      <FlowRow label="Gross Profit" value={grossProfit} />
      <Arrow />
      <FlowRow label="Fixed Monthly Costs" value={fixedCosts} isSubtraction />
      <Arrow />
      <FlowRow label="Marketing Spend" value={marketingSpend} isSubtraction />
      <Arrow />
      <FlowRow
        label={isProfit ? 'Operating Profit' : isLoss ? 'Operating Loss' : 'Break-even'}
        value={Math.abs(operatingResult)}
        isResult
        positive={isProfit && operatingResult !== 0}
        negative={isLoss}
      />
    </div>
  )
}

// ── BreakEvenVisual ───────────────────────────────────────────────────────────

function BreakEvenVisual({
  customers,
  breakEven,
}: {
  customers: number
  breakEven: number | null
}) {
  if (breakEven === null) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Break-even cannot be reached while contribution per customer is ₹0 or negative. Increase
        price or reduce variable cost.
      </div>
    )
  }

  const max = Math.max(customers, breakEven) * 1.1 || 1
  const breakEvenPct = Math.min(100, (breakEven / max) * 100)
  const customersPct = Math.min(100, (customers / max) * 100)
  const isAbove = customers >= breakEven
  const gap = customers - breakEven

  return (
    <div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs mb-3">
        <span>
          <span className="font-semibold text-slate-700">Current: </span>
          <span className="tabular-nums">{customers.toLocaleString('en-IN')}</span>
        </span>
        <span>
          <span className="font-semibold text-slate-700">Break-even: </span>
          <span className="tabular-nums">{breakEven.toLocaleString('en-IN')}</span>
        </span>
        <span className={isAbove ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>
          {isAbove
            ? `+${Math.abs(gap).toLocaleString('en-IN')} above break-even`
            : `Customer gap to break-even: ${Math.abs(gap).toLocaleString('en-IN')}`}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-6 rounded-full bg-slate-100 overflow-visible">
        {/* Break-even marker */}
        <div
          className="absolute top-0 bottom-0 flex flex-col items-center"
          style={{ left: `${breakEvenPct}%` }}
        >
          <div className="w-0.5 h-full bg-amber-400" />
        </div>
        {/* Current customers fill */}
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
            isAbove ? 'bg-emerald-400' : 'bg-fuchsia-300'
          }`}
          style={{ width: `${customersPct}%` }}
        />
        {/* Labels below */}
        <div
          className="absolute -bottom-5 text-xs text-amber-600 font-semibold"
          style={{ left: `${breakEvenPct}%`, transform: 'translateX(-50%)' }}
        >
          {breakEven.toLocaleString('en-IN')}
        </div>
        <div
          className={`absolute -bottom-5 text-xs font-semibold ${
            isAbove ? 'text-emerald-600' : 'text-fuchsia-600'
          }`}
          style={{ left: `${customersPct}%`, transform: 'translateX(-50%)' }}
        >
          {customers.toLocaleString('en-IN')}
        </div>
      </div>
      {/* Spacer for labels */}
      <div className="h-6" />
    </div>
  )
}

// ── ComparisonTable ───────────────────────────────────────────────────────────

function ComparisonBadge({ value }: { value: number }) {
  const isPos = value > 0
  const isNeg = value < 0
  return (
    <span className={`font-bold tabular-nums ${isPos ? 'text-emerald-600' : isNeg ? 'text-red-500' : 'text-slate-500'}`}>
      {isPos ? '+' : ''}{fmtCompact(value)}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function StartupEconomics() {
  const [inputs, setInputs] = useState<UnitEconomicsInputs>(DEFAULT_INPUTS)
  const [activePreset, setActivePreset] = useState<string | null>(PRESETS[0].label)

  function set<K extends keyof UnitEconomicsInputs>(key: K, value: UnitEconomicsInputs[K]) {
    setInputs(prev => ({ ...prev, [key]: value }))
    setActivePreset(null)
  }

  function applyPreset(p: Preset) {
    setInputs(p.inputs)
    setActivePreset(p.label)
  }

  function resetDefaults() {
    setInputs(DEFAULT_INPUTS)
    setActivePreset(PRESETS[0].label)
  }

  const result = useMemo(() => calculate(inputs), [inputs])
  const priceScenarios = useMemo(() => calculatePriceScenarios(inputs), [inputs])
  const scaleScenarios = useMemo(() => calculateCustomerScaleScenarios(inputs), [inputs])
  const costScenarios = useMemo(() => calculateCostScenarios(inputs), [inputs])

  const isProfit = result.operatingResult > 0
  const isLoss = result.operatingResult < 0

  const cacPaybackText =
    result.cacPaybackMonths === null
      ? 'Cannot calculate'
      : result.cacPaybackMonths === 0
      ? '0 months (CAC = ₹0)'
      : `${result.cacPaybackMonths.toFixed(1)} months`

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          What makes a startup financially sustainable?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Change the numbers and see how revenue, costs and break-even move.
        </p>
      </div>

      {/* Presets + Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Example Scenarios
          </div>
          <PresetButtons activeLabel={activePreset} onSelect={applyPreset} />
        </div>
        <button
          onClick={resetDefaults}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Main layout: controls + results */}
      <div className="lg:flex lg:gap-8">
        {/* ── Controls ── */}
        <div className="lg:w-80 shrink-0 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Revenue Inputs
            </h3>
            <NumberInput
              id="price"
              label="Price Per Customer / Month (₹)"
              prefix="₹"
              value={inputs.price}
              onChange={v => set('price', v)}
              min={0}
              max={100000}
              hint="Monthly subscription or product price"
            />
            <div className="flex flex-wrap gap-1.5">
              {[99, 299, 499, 999, 1999].map(p => (
                <button
                  key={p}
                  onClick={() => { set('price', p) }}
                  className={`rounded-md border px-2 py-1 text-xs font-semibold transition-colors ${
                    inputs.price === p
                      ? 'border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  ₹{p}
                </button>
              ))}
            </div>

            <NumberInput
              id="customers"
              label="Active Customers"
              value={inputs.customers}
              onChange={v => set('customers', Math.round(v))}
              min={0}
              max={1000000}
            />
            <div className="flex flex-wrap gap-1.5">
              {[100, 500, 1000, 5000, 10000].map(c => (
                <button
                  key={c}
                  onClick={() => { set('customers', c) }}
                  className={`rounded-md border px-2 py-1 text-xs font-semibold transition-colors ${
                    inputs.customers === c
                      ? 'border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {c.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Cost Inputs
            </h3>
            <NumberInput
              id="variableCost"
              label="Variable Cost Per Customer (₹)"
              prefix="₹"
              value={inputs.variableCost}
              onChange={v => set('variableCost', v)}
              min={0}
              hint="Hosting, support, fulfillment — scales with customers"
            />
            <NumberInput
              id="fixedCosts"
              label="Fixed Monthly Costs (₹)"
              prefix="₹"
              value={inputs.fixedCosts}
              onChange={v => set('fixedCosts', v)}
              min={0}
              hint="Salaries, rent, software — does not scale with customers"
            />
            <NumberInput
              id="marketingSpend"
              label="Monthly Marketing Spend (₹)"
              prefix="₹"
              value={inputs.marketingSpend}
              onChange={v => set('marketingSpend', v)}
              min={0}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Acquisition & Churn
            </h3>
            <NumberInput
              id="cac"
              label="Customer Acquisition Cost — CAC (₹)"
              prefix="₹"
              value={inputs.cac}
              onChange={v => set('cac', v)}
              min={0}
            />
            <NumberInput
              id="newCustomers"
              label="New Customers This Month"
              value={inputs.newCustomers}
              onChange={v => set('newCustomers', Math.round(v))}
              min={0}
            />
            {/* CAC vs marketing note */}
            {result.marketingGap !== 0 && (
              <div className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                result.marketingGap > 0
                  ? 'bg-amber-50 border border-amber-200 text-amber-700'
                  : 'bg-slate-50 border border-slate-200 text-slate-500'
              }`}>
                Expected acquisition spend: {fmt(result.acquisitionSpend)}{' '}
                {result.marketingGap > 0
                  ? `— calculated acquisition cost exceeds the entered marketing budget by ${fmt(result.marketingGap)}.`
                  : `— ${fmt(-result.marketingGap)} of marketing budget not accounted for by new-customer acquisition.`}
              </div>
            )}

            <NumberInput
              id="churnRate"
              label="Monthly Churn Rate (%)"
              suffix="%"
              value={inputs.churnRate}
              onChange={v => set('churnRate', clamp(v, 0, 50))}
              min={0}
              max={50}
            />
          </div>
        </div>

        {/* ── Results ── */}
        <div className="flex-1 min-w-0 mt-6 lg:mt-0 space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              label="Monthly Revenue"
              value={fmt(result.revenue)}
              sub={fmtCompact(result.revenue) !== fmt(result.revenue) ? fmtCompact(result.revenue) : undefined}
            />
            <StatCard
              label="Gross Profit"
              value={fmt(result.grossProfit)}
              sub={`${result.grossMarginPct.toFixed(1)}% margin`}
              positive={result.grossProfit > 0}
              negative={result.grossProfit < 0}
            />
            <StatCard
              label={isProfit ? 'Operating Profit' : isLoss ? 'Operating Loss' : 'Operating Result'}
              value={`${isProfit ? '+' : isLoss ? '−' : ''}${fmt(Math.abs(result.operatingResult))}`}
              positive={isProfit}
              negative={isLoss}
            />
            <StatCard
              label="Contribution / Customer"
              value={fmt(result.contributionPerCustomer)}
              sub={`${result.contributionMarginPct.toFixed(1)}% of price`}
              positive={result.contributionPerCustomer > 0}
              negative={result.contributionPerCustomer < 0}
            />
            <StatCard
              label="Break-even Customers"
              value={
                result.breakEvenCustomers === null
                  ? 'N/A'
                  : result.breakEvenCustomers.toLocaleString('en-IN')
              }
            />
            <StatCard label="CAC Payback" value={cacPaybackText} />
          </div>

          {/* Business Flow */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">
              Monthly Financial Flow
            </h3>
            <BusinessFlow
              revenue={result.revenue}
              variableCosts={result.variableCosts}
              grossProfit={result.grossProfit}
              fixedCosts={inputs.fixedCosts}
              marketingSpend={inputs.marketingSpend}
              operatingResult={result.operatingResult}
            />
          </div>

          {/* Unit Economics */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">
              Unit Economics (Per Customer)
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Revenue per customer', value: fmt(inputs.price) },
                { label: 'Variable cost per customer', value: fmt(inputs.variableCost) },
                {
                  label: 'Contribution per customer',
                  value: fmt(result.contributionPerCustomer),
                  highlight: true,
                  positive: result.contributionPerCustomer > 0,
                  negative: result.contributionPerCustomer < 0,
                },
                {
                  label: 'Contribution margin',
                  value: `${result.contributionMarginPct.toFixed(1)}%`,
                },
                { label: 'Customer acquisition cost (CAC)', value: fmt(inputs.cac) },
                { label: 'Approx. CAC payback period', value: cacPaybackText },
              ].map(row => (
                <div
                  key={row.label}
                  className={`flex justify-between items-center px-3 py-2 rounded-lg ${
                    row.highlight ? 'bg-fuchsia-50 border border-fuchsia-100' : 'bg-slate-50'
                  }`}
                >
                  <span className="text-sm text-slate-600">{row.label}</span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      row.positive
                        ? 'text-emerald-700'
                        : row.negative
                        ? 'text-red-600'
                        : 'text-slate-800'
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Break-even visual */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">
              Break-even Position
            </h3>
            <BreakEvenVisual customers={inputs.customers} breakEven={result.breakEvenCustomers} />
          </div>

          {/* Churn / customer flow */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">
              Customer Flow (This Month)
            </h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between px-3 py-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Active customers</span>
                <span className="font-bold text-slate-800 tabular-nums">
                  {inputs.customers.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between px-3 py-2 bg-emerald-50 rounded-lg">
                <span className="text-emerald-700">+ New customers</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  +{inputs.newCustomers.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between px-3 py-2 bg-red-50 rounded-lg">
                <span className="text-red-600">− Est. churned ({inputs.churnRate}%)</span>
                <span className="font-bold text-red-600 tabular-nums">
                  −{result.customersLost.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between px-3 py-2 bg-fuchsia-50 border border-fuchsia-100 rounded-lg font-bold">
                <span className="text-fuchsia-800">= Projected next month</span>
                <span className="text-fuchsia-800 tabular-nums">
                  {result.projectedNextMonthCustomers.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Price experiment */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-slate-800 mb-1">What if the price changes?</h3>
        <p className="text-xs text-slate-500 mb-4">
          All other inputs remain the same. Only price varies.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Scenario</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Price</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Revenue</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Contribution/cust</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Operating result</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Break-even</th>
              </tr>
            </thead>
            <tbody>
              {priceScenarios.map((s, i) => (
                <tr
                  key={s.label}
                  className={`border-b border-slate-50 ${i === 1 ? 'bg-fuchsia-50' : ''}`}
                >
                  <td className="py-2.5 px-3 font-medium text-slate-700">{s.label}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">{fmt(s.price)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">{fmtCompact(s.revenue)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <ComparisonBadge value={s.contributionPerCustomer} />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <ComparisonBadge value={s.operatingResult} />
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">
                    {s.breakEvenCustomers === null
                      ? '—'
                      : s.breakEvenCustomers.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer scale experiment */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-slate-800 mb-1">What if the customer count changes?</h3>
        <p className="text-xs text-slate-500 mb-4">
          Fixed costs stay constant — this shows operating leverage in action.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Scenario</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Customers</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Revenue</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Gross profit</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Operating result</th>
              </tr>
            </thead>
            <tbody>
              {scaleScenarios.map((s, i) => (
                <tr
                  key={s.label}
                  className={`border-b border-slate-50 ${i === 1 ? 'bg-fuchsia-50' : ''}`}
                >
                  <td className="py-2.5 px-3 font-medium text-slate-700">{s.label}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">
                    {s.customers.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">{fmtCompact(s.revenue)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">{fmtCompact(s.grossProfit)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <ComparisonBadge value={s.operatingResult} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost experiment */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-slate-800 mb-1">What if variable costs change?</h3>
        <p className="text-xs text-slate-500 mb-4">
          All other inputs remain the same. Only variable cost per customer varies.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Scenario</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Var. cost/cust</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Contribution/cust</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Gross margin</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Operating result</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Break-even</th>
              </tr>
            </thead>
            <tbody>
              {costScenarios.map((s, i) => (
                <tr
                  key={s.label}
                  className={`border-b border-slate-50 ${i === 1 ? 'bg-fuchsia-50' : ''}`}
                >
                  <td className="py-2.5 px-3 font-medium text-slate-700">{s.label}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">{fmt(s.variableCost)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <ComparisonBadge value={s.contributionPerCustomer} />
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">
                    {s.grossMarginPct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <ComparisonBadge value={s.operatingResult} />
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">
                    {s.breakEvenCustomers === null
                      ? '—'
                      : s.breakEvenCustomers.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-100 pt-4">
        This simulator uses fictional example values for illustration only. Numbers entered here do
        not constitute financial, business, or investment advice. All calculations are local to your
        browser and are not saved or shared.
      </p>
    </div>
  )
}
