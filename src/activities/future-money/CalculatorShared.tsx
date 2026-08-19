import type { ReactNode } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'

// ── Result Card ───────────────────────────────────────────────────────────────

interface ResultCardProps {
  label: string
  value: string
  subValue?: string
  large?: boolean
  color?: 'default' | 'emerald'
}

export function ResultCard({ label, value, subValue, large = false, color = 'default' }: ResultCardProps) {
  const container = color === 'emerald' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'
  const valueColor = color === 'emerald' ? 'text-emerald-700' : 'text-slate-900'
  return (
    <div className={`rounded-xl border p-4 ${container}`}>
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`font-extrabold leading-tight ${large ? 'text-2xl sm:text-3xl' : 'text-xl'} ${valueColor}`}>
        {value}
      </p>
      {subValue && <p className="mt-1 text-xs leading-relaxed text-slate-400">{subValue}</p>}
    </div>
  )
}

// ── Input Field ───────────────────────────────────────────────────────────────

interface InputFieldProps {
  label: string
  value: string
  onChange: (val: string) => void
  prefix?: string
  suffix?: string
  min?: number
  max?: number
  step?: number
  placeholder?: string
  hint?: string
}

export function InputField({
  label, value, onChange, prefix, suffix, min, max, step, placeholder, hint,
}: InputFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
        {prefix && (
          <span className="select-none border-r border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step ?? 1}
          placeholder={placeholder ?? '0'}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
        />
        {suffix && (
          <span className="select-none border-l border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-400">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

// ── Preset Chips ──────────────────────────────────────────────────────────────

interface Preset { label: string; value: number }

interface PresetChipsProps {
  presets: Preset[]
  onSelect: (val: number) => void
  current?: number
}

export function PresetChips({ presets, onSelect, current }: PresetChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((p) => {
        const active = current !== undefined && Math.abs(current - p.value) < 0.001
        return (
          <button
            key={p.value}
            type="button"
            onClick={() => onSelect(p.value)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              active
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Contribution Bar ──────────────────────────────────────────────────────────

interface ContributionBarProps {
  totalContribution: number
  finalValue: number
}

export function ContributionBar({ totalContribution, finalValue }: ContributionBarProps) {
  const { t } = useLanguage()
  if (finalValue <= 0) return null
  const contribPct = Math.max(0, Math.min(100, (totalContribution / finalValue) * 100))
  const growthPct = 100 - contribPct

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('act1.yourBreakdown')}</p>
      <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="bg-emerald-600 transition-all duration-500" style={{ width: `${contribPct}%` }} />
        <div className="bg-emerald-200 transition-all duration-500" style={{ width: `${growthPct}%` }} />
      </div>
      <div className="flex flex-col gap-1.5 text-xs sm:flex-row sm:gap-6">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-600" />
          <span className="text-slate-600">{t('act1.yourContribution')} ({contribPct.toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full border border-emerald-300 bg-emerald-200" />
          <span className="text-slate-600">{t('act1.estimatedGrowth')} ({growthPct.toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  )
}

// ── Section Card ──────────────────────────────────────────────────────────────

export function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

// ── Period Badge ──────────────────────────────────────────────────────────────

export function PeriodBadge({ years, months }: { years: number; months: number }) {
  const { t } = useLanguage()
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
      <span className="text-xs text-slate-500">{t('act1.periodLabel')} </span>
      <span className="text-sm font-bold text-slate-800">
        {years} {years === 1 ? t('act1.yearSingular') : t('act1.yearPlural')} / {months} {t('act1.months')}
      </span>
    </div>
  )
}

// ── Reset Button ──────────────────────────────────────────────────────────────

export function ResetButton({ onClick }: { onClick: () => void }) {
  const { t } = useLanguage()
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
    >
      {t('act1.reset')}
    </button>
  )
}
