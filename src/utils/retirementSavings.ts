import { formatINR } from './finance'
export { formatINR }

export interface RetirementInputs {
  currentAge: number
  monthlyIncome: number
  existingSavings: number
  retirementAge: number
  monthlyExpense: number
  planningAge: number
  bufferEnabled: boolean
  bufferPct: number
}

export interface RetirementResult {
  yearsUntilRetirement: number
  monthsUntilRetirement: number
  retirementYears: number
  retirementMonths: number
  baseCorpus: number
  requiredCorpus: number
  remainingCorpus: number
  monthlySavingRequired: number
  annualSavingRequired: number
  savingsRatePct: number | null
  isIncomeSufficient: boolean
  isAlreadyCovered: boolean
}

export interface AgeComparisonRow {
  retirementAge: number
  yearsToSave: number
  retirementDuration: number
  requiredCorpus: number
  monthlySavingRequired: number
}

export interface ExpenseComparisonRow {
  label: string
  monthlyExpense: number
  requiredCorpus: number
  monthlySavingRequired: number
}

export const RETIREMENT_DEFAULTS: RetirementInputs = {
  currentAge: 21,
  monthlyIncome: 30000,
  existingSavings: 50000,
  retirementAge: 55,
  monthlyExpense: 50000,
  planningAge: 90,
  bufferEnabled: false,
  bufferPct: 10,
}

export const AGE_PRESETS = [18, 21, 25, 30, 35]

export const INCOME_PRESETS = [
  { label: '₹10K', value: 10000 },
  { label: '₹25K', value: 25000 },
  { label: '₹50K', value: 50000 },
  { label: '₹1L', value: 100000 },
]

export const RETIREMENT_AGE_PRESETS = [35, 45, 55, 65]

export const EXPENSE_PRESETS = [
  { label: '₹20K', value: 20000 },
  { label: '₹30K', value: 30000 },
  { label: '₹50K', value: 50000 },
  { label: '₹75K', value: 75000 },
  { label: '₹1L', value: 100000 },
]

export const PLANNING_AGE_PRESETS = [85, 90, 95, 100]

export const BUFFER_PRESETS = [5, 10, 20]

export function parseAge(val: string): number {
  const n = parseInt(val, 10)
  return isNaN(n) ? 0 : Math.max(0, Math.min(120, n))
}

export function parseAmount(val: string): number {
  const n = parseFloat(val.replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : Math.max(0, n)
}

export function formatCompact(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '₹0'
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`
  return formatINR(value)
}

export function validateInputs(inputs: RetirementInputs): string[] {
  const errors: string[] = []
  if (inputs.currentAge > 0 && inputs.retirementAge > 0 && inputs.retirementAge <= inputs.currentAge) {
    errors.push('retirementAge')
  }
  if (inputs.retirementAge > 0 && inputs.planningAge > 0 && inputs.planningAge <= inputs.retirementAge) {
    errors.push('planningAge')
  }
  return errors
}

export function calculateRetirement(inputs: RetirementInputs): RetirementResult {
  const {
    currentAge, monthlyIncome, existingSavings,
    retirementAge, monthlyExpense, planningAge,
    bufferEnabled, bufferPct,
  } = inputs

  const yearsUntilRetirement = Math.max(0, retirementAge - currentAge)
  const monthsUntilRetirement = yearsUntilRetirement * 12

  const retirementYears = Math.max(0, planningAge - retirementAge)
  const retirementMonths = retirementYears * 12

  const baseCorpus = monthlyExpense * retirementMonths
  const requiredCorpus = bufferEnabled
    ? baseCorpus * (1 + bufferPct / 100)
    : baseCorpus

  const remainingCorpus = Math.max(0, requiredCorpus - existingSavings)
  const isAlreadyCovered = existingSavings >= requiredCorpus

  const monthlySavingRequired = monthsUntilRetirement > 0
    ? remainingCorpus / monthsUntilRetirement
    : 0

  const annualSavingRequired = monthlySavingRequired * 12

  const savingsRatePct = monthlyIncome > 0
    ? (monthlySavingRequired / monthlyIncome) * 100
    : null

  const isIncomeSufficient = monthlyIncome <= 0 || monthlySavingRequired <= monthlyIncome

  return {
    yearsUntilRetirement,
    monthsUntilRetirement,
    retirementYears,
    retirementMonths,
    baseCorpus,
    requiredCorpus,
    remainingCorpus,
    monthlySavingRequired,
    annualSavingRequired,
    savingsRatePct,
    isIncomeSufficient,
    isAlreadyCovered,
  }
}

export function calculateAgeComparisons(
  inputs: RetirementInputs,
  ageOptions: number[] = [35, 45, 55, 65],
): AgeComparisonRow[] {
  return ageOptions
    .filter(age => age > inputs.currentAge && age < inputs.planningAge)
    .map(age => {
      const r = calculateRetirement({ ...inputs, retirementAge: age })
      return {
        retirementAge: age,
        yearsToSave: r.yearsUntilRetirement,
        retirementDuration: r.retirementYears,
        requiredCorpus: r.requiredCorpus,
        monthlySavingRequired: r.monthlySavingRequired,
      }
    })
}

export function calculateExpenseComparisons(inputs: RetirementInputs): ExpenseComparisonRow[] {
  return [
    { label: '80%', factor: 0.8 },
    { label: '100%', factor: 1.0 },
    { label: '120%', factor: 1.2 },
  ].map(({ label, factor }) => {
    const expense = Math.round(inputs.monthlyExpense * factor)
    const r = calculateRetirement({ ...inputs, monthlyExpense: expense })
    return {
      label,
      monthlyExpense: expense,
      requiredCorpus: r.requiredCorpus,
      monthlySavingRequired: r.monthlySavingRequired,
    }
  })
}
