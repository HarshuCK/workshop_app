import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import {
  calculateLumpSumFutureValue,
  calculateRequiredMonthlyInvestment,
  formatINR,
  parsePositiveNumber,
  parseRateInput,
} from '../../utils/finance'
import {
  ResultCard,
  InputField,
  PresetChips,
  SectionCard,
  PeriodBadge,
  ResetButton,
} from './CalculatorShared'
import { useLanguage } from '../../i18n/LanguageContext'

const CURRENT_YEAR = new Date().getFullYear()
const DEFAULT_TARGET_YEAR = CURRENT_YEAR + 10

const RETURN_PRESETS = [
  { label: '6%', value: 6 },
  { label: '8%', value: 8 },
  { label: '10%', value: 10 },
  { label: '12%', value: 12 },
]

const DEFAULTS = {
  targetAmount: '1000000',
  currentSavings: '100000',
  annualReturn: '10',
  targetYear: String(DEFAULT_TARGET_YEAR),
}

export function TargetWealthMode() {
  const { t } = useLanguage()
  const [targetAmount, setTargetAmount] = useState(DEFAULTS.targetAmount)
  const [currentSavings, setCurrentSavings] = useState(DEFAULTS.currentSavings)
  const [annualReturn, setAnnualReturn] = useState(DEFAULTS.annualReturn)
  const [targetYear, setTargetYear] = useState(DEFAULTS.targetYear)

  const target = parsePositiveNumber(targetAmount)
  const savings = parsePositiveNumber(currentSavings)
  const rate = parseRateInput(annualReturn)
  const rawYear = parseInt(targetYear)
  const validYear = !isNaN(rawYear) ? Math.max(CURRENT_YEAR + 1, rawYear) : DEFAULT_TARGET_YEAR
  const yearDiff = validYear - CURRENT_YEAR
  const months = yearDiff * 12

  const fvExisting = calculateLumpSumFutureValue(savings, rate, months)
  const isTargetMetBySavings = target > 0 && fvExisting >= target
  const requiredMonthly = isTargetMetBySavings
    ? 0
    : calculateRequiredMonthlyInvestment(target, savings, rate, months)

  const totalMonthlyContrib = requiredMonthly * months
  const totalContrib = savings + totalMonthlyContrib
  const estimatedGrowth = Math.max(0, target - totalContrib)

  const handleReset = () => {
    setTargetAmount(DEFAULTS.targetAmount)
    setCurrentSavings(DEFAULTS.currentSavings)
    setAnnualReturn(DEFAULTS.annualReturn)
    setTargetYear(DEFAULTS.targetYear)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <SectionCard className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">{t('act1.yourGoals')}</h3>
          <ResetButton onClick={handleReset} />
        </div>

        <InputField
          label={t('act1.targetAmount')}
          prefix="₹"
          value={targetAmount}
          onChange={setTargetAmount}
          min={0}
          placeholder="1000000"
          hint={t('act1.hintTarget')}
        />

        <InputField
          label={t('act1.currentSavings')}
          prefix="₹"
          value={currentSavings}
          onChange={setCurrentSavings}
          min={0}
          placeholder="0"
        />

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
        {isTargetMetBySavings ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-900">{t('act1.noInvestmentNeeded')}</p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-700">
                  {t('act1.noInvestmentDesc')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ResultCard
            label={t('act1.requiredMonthly')}
            value={formatINR(requiredMonthly)}
            subValue={t('act1.estimatedBased')}
            large
            color="emerald"
          />
        )}

        <ResultCard
          label={t('act1.targetWealth')}
          value={formatINR(target)}
          subValue={`${t('act1.by')} ${validYear}`}
        />

        <div className="grid grid-cols-2 gap-4">
          <ResultCard
            label={t('act1.fvCurrentSavings')}
            value={formatINR(fvExisting)}
          />
          <ResultCard
            label={t('act1.investmentPeriod')}
            value={`${yearDiff}Y / ${months}M`}
          />
        </div>

        {!isTargetMetBySavings && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <ResultCard
                label={t('act1.totalMonthlyContrib')}
                value={formatINR(totalMonthlyContrib)}
              />
              <ResultCard
                label={t('act1.estimatedGrowth')}
                value={formatINR(estimatedGrowth)}
              />
            </div>
            <ResultCard
              label={t('act1.estTotalContrib')}
              value={formatINR(totalContrib)}
              subValue={t('act1.estTotalContribSub')}
            />
          </>
        )}
      </div>
    </div>
  )
}
