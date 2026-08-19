import { useState } from 'react'
import {
  calculateProjection,
  formatINR,
  parsePositiveNumber,
  parseRateInput,
} from '../../utils/finance'
import {
  ResultCard,
  InputField,
  PresetChips,
  ContributionBar,
  SectionCard,
  PeriodBadge,
  ResetButton,
} from './CalculatorShared'
import { useLanguage } from '../../i18n/LanguageContext'

const CURRENT_YEAR = new Date().getFullYear()
const DEFAULT_TARGET_YEAR = CURRENT_YEAR + 10

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

const DEFAULTS = {
  currentSavings: '50000',
  monthlyInvestment: '5000',
  annualReturn: '10',
  targetYear: String(DEFAULT_TARGET_YEAR),
}

export function FutureValueMode() {
  const { t } = useLanguage()
  const [currentSavings, setCurrentSavings] = useState(DEFAULTS.currentSavings)
  const [monthlyInvestment, setMonthlyInvestment] = useState(DEFAULTS.monthlyInvestment)
  const [annualReturn, setAnnualReturn] = useState(DEFAULTS.annualReturn)
  const [targetYear, setTargetYear] = useState(DEFAULTS.targetYear)

  const savings = parsePositiveNumber(currentSavings)
  const monthly = parsePositiveNumber(monthlyInvestment)
  const rate = parseRateInput(annualReturn)
  const rawYear = parseInt(targetYear)
  const validYear = !isNaN(rawYear) ? Math.max(CURRENT_YEAR + 1, rawYear) : DEFAULT_TARGET_YEAR
  const yearDiff = validYear - CURRENT_YEAR
  const months = yearDiff * 12

  const result = calculateProjection(savings, monthly, rate, months)

  const handleReset = () => {
    setCurrentSavings(DEFAULTS.currentSavings)
    setMonthlyInvestment(DEFAULTS.monthlyInvestment)
    setAnnualReturn(DEFAULTS.annualReturn)
    setTargetYear(DEFAULTS.targetYear)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <SectionCard className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">{t('act1.yourNumbers')}</h3>
          <ResetButton onClick={handleReset} />
        </div>

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
            hint={t('act1.hintReturn')}
          />
          <PresetChips
            presets={RETURN_PRESETS}
            onSelect={(v) => setAnnualReturn(String(v))}
            current={parseRateInput(annualReturn)}
          />
        </div>

        <div className="space-y-2">
          <InputField
            label={t('act1.targetYear')}
            value={targetYear}
            onChange={setTargetYear}
            min={CURRENT_YEAR + 1}
            max={CURRENT_YEAR + 50}
            step={1}
            placeholder={String(DEFAULT_TARGET_YEAR)}
          />
          <PeriodBadge years={yearDiff} months={months} />
        </div>
      </SectionCard>

      {/* Results */}
      <div className="flex flex-col gap-4">
        <ResultCard
          label={t('act1.estimatedFinalValue')}
          value={formatINR(result.finalValue)}
          subValue={t('act1.estimatedBased')}
          large
          color="emerald"
        />

        <div className="grid grid-cols-2 gap-4">
          <ResultCard label={t('act1.totalContribution')} value={formatINR(result.totalContribution)} />
          <ResultCard label={t('act1.estimatedGrowth')} value={formatINR(result.estimatedGrowth)} />
        </div>

        <ContributionBar
          totalContribution={result.totalContribution}
          finalValue={result.finalValue}
        />

        <ResultCard
          label={t('act1.investmentPeriod')}
          value={`${yearDiff} ${yearDiff === 1 ? t('act1.yearSingular') : t('act1.yearPlural')}`}
          subValue={`${months} ${t('act1.months')} · ${t('act1.targetYear')}: ${validYear}`}
        />
      </div>
    </div>
  )
}
