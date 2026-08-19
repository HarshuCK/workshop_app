// ── Types ─────────────────────────────────────────────────────────────────────

export interface UnitEconomicsInputs {
  price: number
  customers: number
  variableCost: number
  fixedCosts: number
  marketingSpend: number
  cac: number
  newCustomers: number
  churnRate: number // percentage 0–50
}

export interface UnitEconomicsResult {
  revenue: number
  variableCosts: number
  grossProfit: number
  grossMarginPct: number
  contributionPerCustomer: number
  contributionMarginPct: number
  operatingResult: number
  acquisitionSpend: number
  marketingGap: number             // positive = over budget, negative = under budget
  breakEvenCustomers: number | null // null when contribution <= 0
  cacPaybackMonths: number | null   // null when contribution <= 0, 0 when cac === 0
  customersLost: number
  netCustomerChange: number
  projectedNextMonthCustomers: number
}

export interface ScenarioComparison {
  label: string
  price: number
  revenue: number
  contributionPerCustomer: number
  operatingResult: number
  breakEvenCustomers: number | null
}

export interface CustomerScaleComparison {
  label: string
  customers: number
  revenue: number
  grossProfit: number
  operatingResult: number
}

export interface CostComparison {
  label: string
  variableCost: number
  contributionPerCustomer: number
  grossMarginPct: number
  operatingResult: number
  breakEvenCustomers: number | null
}

// ── Core calculations ─────────────────────────────────────────────────────────

export function calculateRevenue(price: number, customers: number): number {
  return price * customers
}

export function calculateVariableCosts(variableCost: number, customers: number): number {
  return variableCost * customers
}

export function calculateGrossProfit(revenue: number, variableCosts: number): number {
  return revenue - variableCosts
}

export function calculateGrossMargin(grossProfit: number, revenue: number): number {
  if (revenue === 0) return 0
  return (grossProfit / revenue) * 100
}

export function calculateContributionPerCustomer(
  price: number,
  variableCost: number
): number {
  return price - variableCost
}

export function calculateContributionMarginPct(
  contributionPerCustomer: number,
  price: number
): number {
  if (price === 0) return 0
  return (contributionPerCustomer / price) * 100
}

export function calculateOperatingResult(
  grossProfit: number,
  fixedCosts: number,
  marketingSpend: number
): number {
  return grossProfit - fixedCosts - marketingSpend
}

export function calculateBreakEvenCustomers(
  fixedCosts: number,
  marketingSpend: number,
  contributionPerCustomer: number
): number | null {
  if (contributionPerCustomer <= 0) return null
  return Math.ceil((fixedCosts + marketingSpend) / contributionPerCustomer)
}

export function calculateAcquisitionSpend(newCustomers: number, cac: number): number {
  return newCustomers * cac
}

export function calculateCACPayback(
  cac: number,
  contributionPerCustomer: number
): number | null {
  if (cac === 0) return 0
  if (contributionPerCustomer <= 0) return null
  return cac / contributionPerCustomer
}

// ── Full result ───────────────────────────────────────────────────────────────

export function calculate(inputs: UnitEconomicsInputs): UnitEconomicsResult {
  const {
    price,
    customers,
    variableCost,
    fixedCosts,
    marketingSpend,
    cac,
    newCustomers,
    churnRate,
  } = inputs

  const revenue = calculateRevenue(price, customers)
  const variableCosts = calculateVariableCosts(variableCost, customers)
  const grossProfit = calculateGrossProfit(revenue, variableCosts)
  const grossMarginPct = calculateGrossMargin(grossProfit, revenue)
  const contributionPerCustomer = calculateContributionPerCustomer(price, variableCost)
  const contributionMarginPct = calculateContributionMarginPct(contributionPerCustomer, price)
  const operatingResult = calculateOperatingResult(grossProfit, fixedCosts, marketingSpend)
  const acquisitionSpend = calculateAcquisitionSpend(newCustomers, cac)
  const marketingGap = acquisitionSpend - marketingSpend
  const breakEvenCustomers = calculateBreakEvenCustomers(
    fixedCosts,
    marketingSpend,
    contributionPerCustomer
  )
  const cacPaybackMonths = calculateCACPayback(cac, contributionPerCustomer)
  const customersLost = Math.round(customers * (churnRate / 100))
  const netCustomerChange = newCustomers - customersLost
  const projectedNextMonthCustomers = Math.max(0, customers + netCustomerChange)

  return {
    revenue,
    variableCosts,
    grossProfit,
    grossMarginPct,
    contributionPerCustomer,
    contributionMarginPct,
    operatingResult,
    acquisitionSpend,
    marketingGap,
    breakEvenCustomers,
    cacPaybackMonths,
    customersLost,
    netCustomerChange,
    projectedNextMonthCustomers,
  }
}

// ── Scenario comparisons ──────────────────────────────────────────────────────

export function calculatePriceScenarios(
  inputs: UnitEconomicsInputs
): ScenarioComparison[] {
  const prices = [
    { label: '−20% price', multiplier: 0.8 },
    { label: 'Current price', multiplier: 1 },
    { label: '+20% price', multiplier: 1.2 },
  ]
  return prices.map(({ label, multiplier }) => {
    const p = Math.max(0, inputs.price * multiplier)
    const revenue = calculateRevenue(p, inputs.customers)
    const variableCosts = calculateVariableCosts(inputs.variableCost, inputs.customers)
    const grossProfit = calculateGrossProfit(revenue, variableCosts)
    const operatingResult = calculateOperatingResult(
      grossProfit,
      inputs.fixedCosts,
      inputs.marketingSpend
    )
    const contributionPerCustomer = calculateContributionPerCustomer(p, inputs.variableCost)
    const breakEvenCustomers = calculateBreakEvenCustomers(
      inputs.fixedCosts,
      inputs.marketingSpend,
      contributionPerCustomer
    )
    return { label, price: p, revenue, contributionPerCustomer, operatingResult, breakEvenCustomers }
  })
}

export function calculateCustomerScaleScenarios(
  inputs: UnitEconomicsInputs
): CustomerScaleComparison[] {
  const scales = [
    { label: '50% customers', multiplier: 0.5 },
    { label: 'Current customers', multiplier: 1 },
    { label: '2× customers', multiplier: 2 },
  ]
  return scales.map(({ label, multiplier }) => {
    const c = Math.round(inputs.customers * multiplier)
    const revenue = calculateRevenue(inputs.price, c)
    const variableCosts = calculateVariableCosts(inputs.variableCost, c)
    const grossProfit = calculateGrossProfit(revenue, variableCosts)
    const operatingResult = calculateOperatingResult(
      grossProfit,
      inputs.fixedCosts,
      inputs.marketingSpend
    )
    return { label, customers: c, revenue, grossProfit, operatingResult }
  })
}

export function calculateCostScenarios(
  inputs: UnitEconomicsInputs
): CostComparison[] {
  const scenarios = [
    { label: '−20% variable cost', multiplier: 0.8 },
    { label: 'Current variable cost', multiplier: 1 },
    { label: '+20% variable cost', multiplier: 1.2 },
  ]
  return scenarios.map(({ label, multiplier }) => {
    const vc = Math.max(0, inputs.variableCost * multiplier)
    const revenue = calculateRevenue(inputs.price, inputs.customers)
    const variableCosts = calculateVariableCosts(vc, inputs.customers)
    const grossProfit = calculateGrossProfit(revenue, variableCosts)
    const grossMarginPct = calculateGrossMargin(grossProfit, revenue)
    const operatingResult = calculateOperatingResult(
      grossProfit,
      inputs.fixedCosts,
      inputs.marketingSpend
    )
    const contributionPerCustomer = calculateContributionPerCustomer(inputs.price, vc)
    const breakEvenCustomers = calculateBreakEvenCustomers(
      inputs.fixedCosts,
      inputs.marketingSpend,
      contributionPerCustomer
    )
    return { label, variableCost: vc, contributionPerCustomer, grossMarginPct, operatingResult, breakEvenCustomers }
  })
}
