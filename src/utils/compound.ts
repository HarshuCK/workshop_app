import { calculateLumpSumFutureValue, calculateRecurringFutureValue } from './finance'

export interface GrowthDataPoint {
  year: number
  totalContribution: number
  compoundValue: number
  simpleValue: number
  estimatedGrowth: number
}

/** Compound FV: lump-sum + monthly annuity, monthly compounding. */
export function calculateCompoundValue(
  startingAmount: number,
  monthlyContribution: number,
  annualRatePercent: number,
  months: number
): number {
  const fvLump = calculateLumpSumFutureValue(startingAmount, annualRatePercent, months)
  const fvRecurring = calculateRecurringFutureValue(monthlyContribution, annualRatePercent, months)
  return fvLump + fvRecurring
}

/**
 * Simple-growth comparison.
 * Lump sum: P × (1 + r × years).
 * Monthly contributions: each earns simple interest for its remaining time.
 * Contribution at month m grows for (totalMonths − m) months.
 */
export function calculateSimpleProjection(
  startingAmount: number,
  monthlyContribution: number,
  annualRatePercent: number,
  years: number
): number {
  const r = annualRatePercent / 100
  const totalMonths = years * 12
  const simpleStart = startingAmount * (1 + r * years)
  let simpleContribs = 0
  for (let m = 1; m <= totalMonths; m++) {
    const remainingYears = (totalMonths - m) / 12
    simpleContribs += monthlyContribution * (1 + r * remainingYears)
  }
  return simpleStart + simpleContribs
}

/** Year-by-year series from Year 0 through the selected year. */
export function generateGrowthSeries(
  startingAmount: number,
  monthlyContribution: number,
  annualRatePercent: number,
  years: number
): GrowthDataPoint[] {
  const series: GrowthDataPoint[] = [
    {
      year: 0,
      totalContribution: startingAmount,
      compoundValue: startingAmount,
      simpleValue: startingAmount,
      estimatedGrowth: 0,
    },
  ]
  for (let y = 1; y <= years; y++) {
    const months = y * 12
    const totalContribution = startingAmount + monthlyContribution * months
    const compoundValue = calculateCompoundValue(startingAmount, monthlyContribution, annualRatePercent, months)
    const simpleValue = calculateSimpleProjection(startingAmount, monthlyContribution, annualRatePercent, y)
    const estimatedGrowth = Math.max(0, compoundValue - totalContribution)
    series.push({ year: y, totalContribution, compoundValue, simpleValue, estimatedGrowth })
  }
  return series
}

/**
 * Finds the earliest year where estimated growth ≥ total contributions
 * (i.e. compoundValue ≥ 2 × totalContribution).
 */
export function findGrowthCrossover(
  startingAmount: number,
  monthlyContribution: number,
  annualRatePercent: number,
  years: number
): number | null {
  if (annualRatePercent <= 0) return null
  for (let y = 1; y <= years; y++) {
    const months = y * 12
    const totalContrib = startingAmount + monthlyContribution * months
    if (totalContrib <= 0) continue
    const cv = calculateCompoundValue(startingAmount, monthlyContribution, annualRatePercent, months)
    if (cv - totalContrib >= totalContrib) return y
  }
  return null
}

/**
 * Doubling time using monthly compounding.
 * Only meaningful when recurring contributions = 0.
 */
export function calculateDoublingTime(annualRatePercent: number): number | null {
  if (annualRatePercent <= 0) return null
  const monthlyRate = annualRatePercent / 100 / 12
  return Math.log(2) / Math.log(1 + monthlyRate) / 12
}

/** Abbreviated INR for chart axis labels. */
export function formatINRCompact(value: number): string {
  if (!isFinite(value) || isNaN(value) || value < 0) return '₹0'
  const v = Math.round(value)
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`
  return `₹${v}`
}
