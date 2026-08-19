import { formatINR } from './finance'

export { formatINR as formatSalaryAmount }

export interface SalaryInputs {
  annualCTC: number
  fixedPct: number
  variablePct: number
  employerPct: number
  basicPct: number
  hraPct: number
  otherAllowancePct: number
  employeePFPct: number
  professionalTaxMonthly: number
  otherDeductionsMonthly: number
  estimatedTaxMonthly: number
}

export interface SalaryBreakdownResult {
  annualFixed: number
  annualVariable: number
  annualEmployerContrib: number
  annualBasic: number
  annualHRA: number
  annualOtherAllowance: number
  monthlyGross: number
  monthlyBasic: number
  monthlyPF: number
  totalMonthlyDeductions: number
  monthlyInHand: number
  isDeductionsExceedGross: boolean
  annualVariableMonthlyEquiv: number
  mainAllocationTotal: number
  fixedAllocationTotal: number
}

export const SALARY_DEFAULTS: SalaryInputs = {
  annualCTC: 600000,
  fixedPct: 80,
  variablePct: 10,
  employerPct: 10,
  basicPct: 50,
  hraPct: 30,
  otherAllowancePct: 20,
  employeePFPct: 12,
  professionalTaxMonthly: 200,
  otherDeductionsMonthly: 0,
  estimatedTaxMonthly: 0,
}

export const CTC_PRESETS = [
  { label: '₹3 LPA', value: 300000 },
  { label: '₹5 LPA', value: 500000 },
  { label: '₹8 LPA', value: 800000 },
  { label: '₹12 LPA', value: 1200000 },
  { label: '₹20 LPA', value: 2000000 },
]

export function calculateAllocationTotal(a: number, b: number, c: number): number {
  return a + b + c
}

export function calculateMonthlyPF(monthlyBasic: number, pfPct: number): number {
  return monthlyBasic * pfPct / 100
}

export function calculateSalaryBreakdown(inputs: SalaryInputs): SalaryBreakdownResult {
  const {
    annualCTC, fixedPct, variablePct, employerPct,
    basicPct, hraPct, otherAllowancePct,
    employeePFPct, professionalTaxMonthly, otherDeductionsMonthly, estimatedTaxMonthly,
  } = inputs

  const mainAllocationTotal = calculateAllocationTotal(fixedPct, variablePct, employerPct)
  const fixedAllocationTotal = calculateAllocationTotal(basicPct, hraPct, otherAllowancePct)

  const annualFixed = annualCTC * fixedPct / 100
  const annualVariable = annualCTC * variablePct / 100
  const annualEmployerContrib = annualCTC * employerPct / 100

  const annualBasic = annualFixed * basicPct / 100
  const annualHRA = annualFixed * hraPct / 100
  const annualOtherAllowance = annualFixed * otherAllowancePct / 100

  const monthlyGross = annualFixed / 12
  const monthlyBasic = annualBasic / 12

  const monthlyPF = calculateMonthlyPF(monthlyBasic, employeePFPct)
  const totalMonthlyDeductions =
    monthlyPF + professionalTaxMonthly + otherDeductionsMonthly + estimatedTaxMonthly

  const rawInHand = monthlyGross - totalMonthlyDeductions
  const isDeductionsExceedGross = rawInHand < 0
  const monthlyInHand = Math.max(0, rawInHand)

  return {
    annualFixed,
    annualVariable,
    annualEmployerContrib,
    annualBasic,
    annualHRA,
    annualOtherAllowance,
    monthlyGross,
    monthlyBasic,
    monthlyPF,
    totalMonthlyDeductions,
    monthlyInHand,
    isDeductionsExceedGross,
    annualVariableMonthlyEquiv: annualVariable / 12,
    mainAllocationTotal,
    fixedAllocationTotal,
  }
}

/** Algebraic reverse: given desired monthly in-hand, estimate required CTC. */
export function calculateCTCFromInHand(
  targetMonthlyInHand: number,
  inputs: Omit<SalaryInputs, 'annualCTC'>
): number {
  if (targetMonthlyInHand <= 0 || inputs.fixedPct <= 0) return 0
  const { fixedPct, basicPct, employeePFPct, professionalTaxMonthly, otherDeductionsMonthly, estimatedTaxMonthly } = inputs
  // In-Hand = (CTC / 12) × fixedFraction × (1 − basicFraction × pfFraction) − fixedMonthlyDeductions
  // ∴ CTC = (In-Hand + fixedMonthlyDeductions) × 12 / [fixedFraction × (1 − basicFraction × pfFraction)]
  const netFactor = (fixedPct / 100) * (1 - (basicPct / 100) * (employeePFPct / 100))
  if (netFactor <= 0) return 0
  const fixedMonthlyDeductions = professionalTaxMonthly + otherDeductionsMonthly + estimatedTaxMonthly
  return ((targetMonthlyInHand + fixedMonthlyDeductions) * 12) / netFactor
}

export function parsePctInput(val: string): number {
  const n = parseFloat(val)
  return isNaN(n) ? 0 : Math.max(0, Math.min(100, n))
}

export function parseAmountInput(val: string): number {
  const n = parseFloat(val.replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : Math.max(0, n)
}

export function parseCTCInput(val: string): number {
  const n = parseFloat(val.replace(/[^0-9]/g, ''))
  return isNaN(n) ? 0 : Math.max(0, Math.min(10000000, n))
}
