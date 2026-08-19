import { formatINR } from './finance'

export { formatINR }

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoanSummary {
  principal: number
  emi: number
  totalRepayment: number
  totalInterest: number
  downPayment: number
  totalOutflow: number
  interestPct: number          // totalInterest / principal * 100
  months: number
}

export interface AmortizationMonth {
  month: number
  openingBalance: number
  principalPaid: number
  interestPaid: number
  closingBalance: number
}

export interface AmortizationYear {
  year: number
  openingBalance: number
  principalPaid: number
  interestPaid: number
  closingBalance: number
}

export interface TenureOption {
  years: number
  months: number
  emi: number
  totalRepayment: number
  totalInterest: number
}

export interface RateOption {
  rate: number
  emi: number
  totalRepayment: number
  totalInterest: number
}

// ── Core EMI formula ─────────────────────────────────────────────────────────

/**
 * Standard reducing-balance EMI.
 * r = monthly interest rate (annualRatePct / 100 / 12)
 * n = number of monthly payments
 *
 * When r = 0: EMI = P / n
 */
export function calculateEMI(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0
  if (annualRatePct === 0) return principal / months
  const r = annualRatePct / 100 / 12
  const pow = Math.pow(1 + r, months)
  return (principal * r * pow) / (pow - 1)
}

// ── Loan summary ──────────────────────────────────────────────────────────────

export function calculateLoanSummary(
  purchasePrice: number,
  downPayment: number,
  annualRatePct: number,
  tenureYears: number
): LoanSummary {
  const clampedDown = Math.min(downPayment, purchasePrice)
  const principal = Math.max(0, purchasePrice - clampedDown)
  const months = tenureYears * 12
  const emi = calculateEMI(principal, annualRatePct, months)
  const totalRepayment = emi * months
  const totalInterest = Math.max(0, totalRepayment - principal)
  const totalOutflow = clampedDown + totalRepayment
  const interestPct = principal > 0 ? (totalInterest / principal) * 100 : 0
  return {
    principal,
    emi,
    totalRepayment,
    totalInterest,
    downPayment: clampedDown,
    totalOutflow,
    interestPct,
    months,
  }
}

// ── Amortization ──────────────────────────────────────────────────────────────

export function generateAmortizationSchedule(
  principal: number,
  annualRatePct: number,
  months: number
): AmortizationMonth[] {
  if (principal <= 0 || months <= 0) return []
  const emi = calculateEMI(principal, annualRatePct, months)
  const r = annualRatePct / 100 / 12
  const schedule: AmortizationMonth[] = []
  let balance = principal

  for (let m = 1; m <= months; m++) {
    const openingBalance = balance
    const interestPaid = balance * r          // 0 when r = 0
    let principalPaid = emi - interestPaid

    // Final month: clear any floating-point residue
    if (m === months) {
      principalPaid = balance
    }
    principalPaid = Math.min(principalPaid, balance)

    const closingBalance = Math.max(0, balance - principalPaid)
    schedule.push({ month: m, openingBalance, principalPaid, interestPaid, closingBalance })
    balance = closingBalance
  }

  return schedule
}

export function aggregateAmortizationByYear(months: AmortizationMonth[]): AmortizationYear[] {
  if (months.length === 0) return []
  const yearMap = new Map<number, AmortizationYear>()

  for (const m of months) {
    const year = Math.ceil(m.month / 12)
    const existing = yearMap.get(year)
    if (existing) {
      existing.principalPaid += m.principalPaid
      existing.interestPaid += m.interestPaid
      existing.closingBalance = m.closingBalance
    } else {
      yearMap.set(year, {
        year,
        openingBalance: m.openingBalance,
        principalPaid: m.principalPaid,
        interestPaid: m.interestPaid,
        closingBalance: m.closingBalance,
      })
    }
  }

  return Array.from(yearMap.values()).sort((a, b) => a.year - b.year)
}

// ── Tenure comparison ─────────────────────────────────────────────────────────

export function calculateTenureComparison(
  principal: number,
  annualRatePct: number,
  currentYears: number
): TenureOption[] {
  const candidates = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30]
  // Pick options shorter, equal, and longer than current; always include current
  const shorter = candidates.filter(y => y < currentYears).slice(-2)
  const longer = candidates.filter(y => y > currentYears).slice(0, 2)
  const set = new Set([...shorter, currentYears, ...longer])
  const years = Array.from(set).sort((a, b) => a - b)

  return years.map(y => {
    const m = y * 12
    const emi = calculateEMI(principal, annualRatePct, m)
    const totalRepayment = emi * m
    return {
      years: y,
      months: m,
      emi,
      totalRepayment,
      totalInterest: Math.max(0, totalRepayment - principal),
    }
  })
}

// ── Rate comparison ───────────────────────────────────────────────────────────

export function calculateRateComparison(
  principal: number,
  annualRatePct: number,
  months: number
): RateOption[] {
  const offsets = [-4, -2, 0, 2, 4]
  return offsets
    .map(d => {
      const rate = Math.min(30, Math.max(0, annualRatePct + d))
      const emi = calculateEMI(principal, rate, months)
      const totalRepayment = emi * months
      return {
        rate,
        emi,
        totalRepayment,
        totalInterest: Math.max(0, totalRepayment - principal),
      }
    })
    .filter((opt, i, arr) => i === 0 || opt.rate !== arr[i - 1].rate) // deduplicate clamped
}

// ── EMI first & last month breakdown ─────────────────────────────────────────

export interface PaymentBreakdown {
  emi: number
  principal: number
  interest: number
}

export function getFirstPaymentBreakdown(
  principal: number,
  annualRatePct: number,
  months: number
): PaymentBreakdown {
  const emi = calculateEMI(principal, annualRatePct, months)
  const r = annualRatePct / 100 / 12
  const interest = principal * r
  return { emi, interest, principal: Math.max(0, emi - interest) }
}

export function getLastPaymentBreakdown(
  principal: number,
  annualRatePct: number,
  months: number
): PaymentBreakdown {
  const schedule = generateAmortizationSchedule(principal, annualRatePct, months)
  if (schedule.length === 0) return { emi: 0, principal: 0, interest: 0 }
  const last = schedule[schedule.length - 1]
  const emi = last.principalPaid + last.interestPaid
  return { emi, principal: last.principalPaid, interest: last.interestPaid }
}

// Re-export for convenience inside component
export { formatINR as fmt }
