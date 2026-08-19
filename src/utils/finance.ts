export interface ProjectionResult {
  finalValue: number
  totalContribution: number
  estimatedGrowth: number
  fvExistingSavings: number
  fvMonthlyInvestments: number
}

/** FV = P × (1 + i)^n, monthly compounding. */
export function calculateLumpSumFutureValue(
  principal: number,
  annualRatePercent: number,
  months: number
): number {
  if (principal <= 0) return 0
  if (months <= 0) return principal
  if (annualRatePercent === 0) return principal
  const i = annualRatePercent / 100 / 12
  return principal * Math.pow(1 + i, months)
}

/** FV of ordinary annuity: PMT × [((1+i)^n − 1) / i]. */
export function calculateRecurringFutureValue(
  monthlyAmount: number,
  annualRatePercent: number,
  months: number
): number {
  if (monthlyAmount <= 0 || months <= 0) return 0
  if (annualRatePercent === 0) return monthlyAmount * months
  const i = annualRatePercent / 100 / 12
  return monthlyAmount * ((Math.pow(1 + i, months) - 1) / i)
}

/** Combined lump-sum + recurring projection. */
export function calculateProjection(
  currentSavings: number,
  monthlyInvestment: number,
  annualRatePercent: number,
  months: number
): ProjectionResult {
  const fvExistingSavings = calculateLumpSumFutureValue(currentSavings, annualRatePercent, months)
  const fvMonthlyInvestments = calculateRecurringFutureValue(monthlyInvestment, annualRatePercent, months)
  const finalValue = fvExistingSavings + fvMonthlyInvestments
  const totalContribution = currentSavings + monthlyInvestment * months
  const estimatedGrowth = Math.max(0, finalValue - totalContribution)
  return { finalValue, totalContribution, estimatedGrowth, fvExistingSavings, fvMonthlyInvestments }
}

/** Solve ordinary annuity for PMT given a target amount. */
export function calculateRequiredMonthlyInvestment(
  targetAmount: number,
  currentSavings: number,
  annualRatePercent: number,
  months: number
): number {
  if (months <= 0 || targetAmount <= 0) return 0
  const fvExisting = calculateLumpSumFutureValue(currentSavings, annualRatePercent, months)
  const remaining = targetAmount - fvExisting
  if (remaining <= 0) return 0
  if (annualRatePercent === 0) return remaining / months
  const i = annualRatePercent / 100 / 12
  const denom = Math.pow(1 + i, months) - 1
  if (denom <= 0) return 0
  return (remaining * i) / denom
}

export function formatINR(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

export function parsePositiveNumber(val: string): number {
  const n = parseFloat(val.replace(/[^0-9.]/g, ''))
  return isNaN(n) || n < 0 ? 0 : n
}

export function parseRateInput(val: string): number {
  const n = parseFloat(val)
  if (isNaN(n)) return 0
  return Math.min(30, Math.max(0, n))
}
