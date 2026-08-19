import { useState } from 'react'
import { calculateProjection, formatINR, parsePositiveNumber, parseRateInput } from '../../utils/finance'
import { InputField, PresetChips, SectionCard, ResetButton } from './CalculatorShared'
import { useLanguage } from '../../i18n/LanguageContext'

const MILESTONES = [5, 10, 15, 20]

const MONTHLY_PRESETS = [
  { label: '₹1,000', value: 1000 },
  { label: '₹5,000', value: 5000 },
  { label: '₹10,000', value: 10000 },
  { label: '₹25,000', value: 25000 },
]

const RETURN_PRESETS = [
  { label: '6%', value: 6 },
  { label: '8%', value: 8 },
  { label: '10%', value: 10 },
  { label: '12%', value: 12 },
]

const DEFAULTS = { currentSavings: '50000', monthlyInvestment: '5000', annualReturn: '10' }

export function ComparisonMode() {
  const { t } = useLanguage()
  const [currentSavings, setCurrentSavings] = useState(DEFAULTS.currentSavings)
  const [monthlyInvestment, setMonthlyInvestment] = useState(DEFAULTS.monthlyInvestment)
  const [annualReturn, setAnnualReturn] = useState(DEFAULTS.annualReturn)

  const savings = parsePositiveNumber(currentSavings)
  const monthly = parsePositiveNumber(monthlyInvestment)
  const rate = parseRateInput(annualReturn)

  const projections = MILESTONES.map((years) => ({
    years,
    months: years * 12,
    result: calculateProjection(savings, monthly, rate, years * 12),
  }))

  const maxFinalValue = Math.max(...projections.map((p) => p.result.finalValue), 1)

  const handleReset = () => {
    setCurrentSavings(DEFAULTS.currentSavings)
    setMonthlyInvestment(DEFAULTS.monthlyInvestment)
    setAnnualReturn(DEFAULTS.annualReturn)
  }

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <SectionCard className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">{t('act1.yourNumbers')}</h3>
          <ResetButton onClick={handleReset} />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <InputField
            label={t('act1.currentSavings')}
            prefix="₹"
            value={currentSavings}
            onChange={setCurrentSavings}
            min={0}
            placeholder="50000"
          />

          <div className="space-y-2">
            <InputField
              label={t('act1.monthlyInvestment')}
              prefix="₹"
              value={monthlyInvestment}
              onChange={setMonthlyInvestment}
              min={0}
              placeholder="5000"
            />
            <PresetChips
              presets={MONTHLY_PRESETS}
              onSelect={(v) => setMonthlyInvestment(String(v))}
              current={parsePositiveNumber(monthlyInvestment)}
            />
          </div>

          <div className="space-y-2">
            <InputField
              label={t('act1.expectedReturn')}
              suffix="%"
              value={annualReturn}
              onChange={setAnnualReturn}
              min={0}
              max={30}
              step={0.5}
              placeholder="10"
            />
            <PresetChips
              presets={RETURN_PRESETS}
              onSelect={(v) => setAnnualReturn(String(v))}
              current={parseRateInput(annualReturn)}
            />
          </div>
        </div>
      </SectionCard>

      {/* Bar chart */}
      <SectionCard>
        <h3 className="mb-5 text-base font-bold text-slate-900">{t('act1.projectedGrowth')}</h3>

        {/* Value labels above bars */}
        <div className="mb-2 flex gap-3">
          {projections.map(({ years, result }) => (
            <div key={years} className="flex-1 text-center">
              <p className="text-xs font-bold leading-tight text-emerald-700">
                {formatINR(result.finalValue)}
              </p>
            </div>
          ))}
        </div>

        {/* Bars */}
        <div
          className="flex items-end gap-3 rounded-xl bg-slate-50 px-4 pb-4"
          style={{ height: '160px' }}
        >
          {projections.map(({ years, result }) => {
            const barH = Math.max(8, (result.finalValue / maxFinalValue) * 110)
            return (
              <div key={years} className="flex h-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-[64px] rounded-t-xl bg-emerald-500 transition-all duration-700"
                  style={{ height: `${barH}px` }}
                />
              </div>
            )
          })}
        </div>

        {/* Year labels */}
        <div className="mt-2 flex gap-3">
          {projections.map(({ years, months }) => (
            <div key={years} className="flex-1 text-center">
              <p className="text-sm font-bold text-slate-700">{years}Y</p>
              <p className="text-xs text-slate-400">{months} mo</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Milestone cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {projections.map(({ years, result }) => (
          <div key={years} className="rounded-xl border border-slate-100 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">{years} {t('act1.years')}</span>
              <span className="text-base font-extrabold text-emerald-700">
                {formatINR(result.finalValue)}
              </span>
            </div>
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${(result.finalValue / maxFinalValue) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{t('act1.contribution')}: {formatINR(result.totalContribution)}</span>
              <span>{t('act1.growth')}: {formatINR(result.estimatedGrowth)}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400">
        {t('act1.assumeMonthly')}
      </p>
    </div>
  )
}
