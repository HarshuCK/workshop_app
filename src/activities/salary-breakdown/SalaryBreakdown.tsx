import { useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { formatINR } from '../../utils/finance'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  SALARY_DEFAULTS, CTC_PRESETS,
  calculateSalaryBreakdown, calculateCTCFromInHand,
  parsePctInput, parseAmountInput, parseCTCInput,
} from '../../utils/salary'
import type { SalaryInputs, SalaryBreakdownResult } from '../../utils/salary'

// ── Shared mini-components ────────────────────────────────────────────────────

function AllocationStatus({ total }: { total: number }) {
  const rounded = Math.round(total * 10) / 10
  const diff = Math.round((total - 100) * 10) / 10
  if (Math.abs(diff) < 0.05) {
    return <span className="text-xs font-semibold text-emerald-600">✓ 100% allocated</span>
  }
  if (diff < 0) {
    return (
      <span className="text-xs font-semibold text-amber-600">
        {rounded}% allocated • {(-diff).toFixed(1)}% remaining
      </span>
    )
  }
  return (
    <span className="text-xs font-semibold text-red-600">
      {rounded}% allocated • Reduce by {diff.toFixed(1)}%
    </span>
  )
}

interface PctInputRowProps {
  label: string
  value: string
  onChange: (v: string) => void
  onCommit: (v: string) => void
  note?: string
}
function PctInputRow({ label, value, onChange, onCommit, note }: PctInputRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {note && <p className="text-xs text-slate-400">{note}</p>}
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onCommit(e.target.value)}
          min={0}
          max={100}
          step={1}
          className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <span className="w-4 text-sm text-slate-400">%</span>
      </div>
    </div>
  )
}

interface AmountInputRowProps {
  label: string
  value: string
  onChange: (v: string) => void
  onCommit: (v: string) => void
  note?: string
}
function AmountInputRow({ label, value, onChange, onCommit, note }: AmountInputRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {note && <p className="text-xs text-slate-400">{note}</p>}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-slate-400">₹</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onCommit(e.target.value)}
          min={0}
          step={1}
          className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <span className="w-12 text-xs text-slate-400">/month</span>
      </div>
    </div>
  )
}

function SectionCard({ title, children, status }: { title: string; children: ReactNode; status?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</h3>
        {status}
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  )
}

interface ResultCardProps {
  label: string
  value: string
  accent?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'
  large?: boolean
  note?: string
}
function ResultCard({ label, value, accent = 'slate', large = false, note }: ResultCardProps) {
  const bg: Record<string, string> = {
    indigo: 'border-indigo-100 bg-indigo-50',
    emerald: 'border-emerald-100 bg-emerald-50',
    amber: 'border-amber-100 bg-amber-50',
    rose: 'border-rose-100 bg-rose-50',
    slate: 'border-slate-100 bg-slate-50',
  }
  const text: Record<string, string> = {
    indigo: 'text-indigo-700',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    rose: 'text-rose-700',
    slate: 'text-slate-700',
  }
  return (
    <div className={`rounded-xl border p-3 ${bg[accent]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 font-bold tabular-nums ${large ? 'text-xl' : 'text-base'} ${text[accent]}`}>{value}</p>
      {note && <p className="mt-0.5 text-xs text-slate-400">{note}</p>}
    </div>
  )
}

// ── CTC Stacked Bar ───────────────────────────────────────────────────────────

function CTCBreakdownBar({ fixedPct, variablePct, employerPct }: { fixedPct: number; variablePct: number; employerPct: number }) {
  return (
    <div>
      <div className="relative h-7 w-full overflow-hidden rounded-lg bg-slate-100">
        <div className="absolute inset-y-0 left-0 flex h-full">
          {fixedPct > 0 && (
            <div style={{ width: `${fixedPct}%` }} className="h-full bg-indigo-500" title={`Fixed ${fixedPct}%`} />
          )}
          {variablePct > 0 && (
            <div style={{ width: `${variablePct}%` }} className="h-full bg-amber-400" title={`Variable ${variablePct}%`} />
          )}
          {employerPct > 0 && (
            <div style={{ width: `${employerPct}%` }} className="h-full bg-emerald-500" title={`Employer ${employerPct}%`} />
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <LegendDot color="bg-indigo-500" label={`Fixed ${fixedPct}%`} />
        <LegendDot color="bg-amber-400" label={`Variable ${variablePct}%`} />
        <LegendDot color="bg-emerald-500" label={`Employer ${employerPct}%`} />
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-slate-600">
      <span className={`inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm ${color}`} />
      {label}
    </span>
  )
}

// ── Salary Flow Visual ────────────────────────────────────────────────────────

interface SalaryFlowProps {
  ctc: number
  fixedPct: number
  annualFixed: number
  monthlyGross: number
  totalDeductions: number
  monthlyInHand: number
  annualVariable: number
  annualEmployer: number
}
function SalaryFlowCard({ ctc, fixedPct, annualFixed, monthlyGross, totalDeductions, monthlyInHand, annualVariable, annualEmployer }: SalaryFlowProps) {
  return (
    <div className="flex flex-col gap-0">
      <FlowNode label="Annual CTC" value={formatINR(ctc)} color="bg-slate-700 text-white" />
      <FlowArrow label={`×${fixedPct}% fixed salary`} />
      <FlowNode label="Fixed Annual Salary" value={formatINR(annualFixed)} color="bg-indigo-500 text-white" />
      <FlowArrow label="÷ 12 months" />
      <FlowNode label="Monthly Gross" value={formatINR(monthlyGross)} color="bg-indigo-400 text-white" />
      <FlowArrow label={`− ${formatINR(totalDeductions)} deductions`} />
      <FlowNode label="Approx. Monthly In-Hand" value={formatINR(monthlyInHand)} color="bg-emerald-500 text-white" />

      <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Separate components</p>
        <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
          <span className="text-sm font-medium text-amber-800">Annual Variable / Bonus</span>
          <span className="font-bold tabular-nums text-amber-700">{formatINR(annualVariable)}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
          <span className="text-sm font-medium text-emerald-800">Employer Contribution</span>
          <span className="font-bold tabular-nums text-emerald-700">{formatINR(annualEmployer)}</span>
        </div>
      </div>
    </div>
  )
}

function FlowNode({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${color}`}>
      <span className="text-sm font-semibold opacity-90">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  )
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="h-3 w-px bg-slate-300" />
      <span className="text-xs text-slate-400">{label}</span>
      <div className="h-3 w-px bg-slate-300" />
    </div>
  )
}

// ── Deduction Breakdown Table ─────────────────────────────────────────────────

interface DeductionBreakdownProps {
  result: SalaryBreakdownResult
  profTax: number
  otherDed: number
  taxDed: number
}
function DeductionBreakdown({ result, profTax, otherDed, taxDed }: DeductionBreakdownProps) {
  const rows: { label: string; value: number; dimIfZero?: boolean }[] = [
    { label: 'Monthly Gross Salary', value: result.monthlyGross },
    { label: '− Employee PF', value: result.monthlyPF, dimIfZero: true },
    { label: '− Professional Tax', value: profTax, dimIfZero: true },
    { label: '− Other Deductions', value: otherDed, dimIfZero: true },
    { label: '− Est. Tax / TDS', value: taxDed, dimIfZero: true },
  ]
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Monthly Deduction Breakdown</h3>
      <div className="divide-y divide-slate-50">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`flex items-center justify-between py-2 text-sm ${
              row.dimIfZero && row.value === 0 ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            <span>{row.label}</span>
            <span className="tabular-nums font-semibold">{formatINR(row.value)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm font-bold text-slate-800">= Approx. Monthly In-Hand</span>
          <span className="text-base font-bold tabular-nums text-emerald-700">{formatINR(result.monthlyInHand)}</span>
        </div>
      </div>
      {result.isDeductionsExceedGross && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          Deductions exceed the calculated monthly gross under the current assumptions.
        </p>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SalaryBreakdown() {
  const { t } = useLanguage()
  const d = SALARY_DEFAULTS

  // CTC input
  const [annualCTCStr, setAnnualCTCStr] = useState(String(d.annualCTC))

  // Main CTC split
  const [fixedPctStr, setFixedPctStr] = useState(String(d.fixedPct))
  const [variablePctStr, setVariablePctStr] = useState(String(d.variablePct))
  const [employerPctStr, setEmployerPctStr] = useState(String(d.employerPct))

  // Fixed salary breakdown
  const [basicPctStr, setBasicPctStr] = useState(String(d.basicPct))
  const [hraPctStr, setHraPctStr] = useState(String(d.hraPct))
  const [otherAllowancePctStr, setOtherAllowancePctStr] = useState(String(d.otherAllowancePct))

  // Deductions
  const [employeePFPctStr, setEmployeePFPctStr] = useState(String(d.employeePFPct))
  const [professionalTaxStr, setProfessionalTaxStr] = useState(String(d.professionalTaxMonthly))
  const [otherDeductionsStr, setOtherDeductionsStr] = useState(String(d.otherDeductionsMonthly))
  const [estimatedTaxStr, setEstimatedTaxStr] = useState(String(d.estimatedTaxMonthly))

  // Options
  const [includeVariable, setIncludeVariable] = useState(false)

  // Tabs
  const [activeTab, setActiveTab] = useState<'forward' | 'reverse'>('forward')
  const [targetInHandStr, setTargetInHandStr] = useState('40000')

  // ── Parsed inputs ──

  const inputs: SalaryInputs = useMemo(() => ({
    annualCTC: parseCTCInput(annualCTCStr),
    fixedPct: parsePctInput(fixedPctStr),
    variablePct: parsePctInput(variablePctStr),
    employerPct: parsePctInput(employerPctStr),
    basicPct: parsePctInput(basicPctStr),
    hraPct: parsePctInput(hraPctStr),
    otherAllowancePct: parsePctInput(otherAllowancePctStr),
    employeePFPct: parsePctInput(employeePFPctStr),
    professionalTaxMonthly: parseAmountInput(professionalTaxStr),
    otherDeductionsMonthly: parseAmountInput(otherDeductionsStr),
    estimatedTaxMonthly: parseAmountInput(estimatedTaxStr),
  }), [
    annualCTCStr, fixedPctStr, variablePctStr, employerPctStr,
    basicPctStr, hraPctStr, otherAllowancePctStr,
    employeePFPctStr, professionalTaxStr, otherDeductionsStr, estimatedTaxStr,
  ])

  const result = useMemo(() => calculateSalaryBreakdown(inputs), [inputs])

  const displayedInHand = includeVariable
    ? result.monthlyInHand + result.annualVariableMonthlyEquiv
    : result.monthlyInHand

  const reverseCTC = useMemo(() => {
    const target = parseAmountInput(targetInHandStr)
    const { annualCTC: _ctc, ...restInputs } = inputs
    return calculateCTCFromInHand(target, restInputs)
  }, [targetInHandStr, inputs])

  // ── Reset ──

  const resetAll = () => {
    setAnnualCTCStr(String(d.annualCTC))
    setFixedPctStr(String(d.fixedPct))
    setVariablePctStr(String(d.variablePct))
    setEmployerPctStr(String(d.employerPct))
    setBasicPctStr(String(d.basicPct))
    setHraPctStr(String(d.hraPct))
    setOtherAllowancePctStr(String(d.otherAllowancePct))
    setEmployeePFPctStr(String(d.employeePFPct))
    setProfessionalTaxStr(String(d.professionalTaxMonthly))
    setOtherDeductionsStr(String(d.otherDeductionsMonthly))
    setEstimatedTaxStr(String(d.estimatedTaxMonthly))
    setIncludeVariable(false)
  }

  // ── Helpers ──

  const pct = (str: string) => parsePctInput(str)
  const amt = (str: string) => parseAmountInput(str)

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {(['forward', 'reverse'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'forward' ? t('act3.tabCTCtoInHand') : t('act3.tabInHandtoCTC')}
          </button>
        ))}
      </div>

      {activeTab === 'forward' ? (
        <ForwardTab
          annualCTCStr={annualCTCStr}
          setAnnualCTCStr={setAnnualCTCStr}
          fixedPctStr={fixedPctStr}
          setFixedPctStr={setFixedPctStr}
          variablePctStr={variablePctStr}
          setVariablePctStr={setVariablePctStr}
          employerPctStr={employerPctStr}
          setEmployerPctStr={setEmployerPctStr}
          basicPctStr={basicPctStr}
          setBasicPctStr={setBasicPctStr}
          hraPctStr={hraPctStr}
          setHraPctStr={setHraPctStr}
          otherAllowancePctStr={otherAllowancePctStr}
          setOtherAllowancePctStr={setOtherAllowancePctStr}
          employeePFPctStr={employeePFPctStr}
          setEmployeePFPctStr={setEmployeePFPctStr}
          professionalTaxStr={professionalTaxStr}
          setProfessionalTaxStr={setProfessionalTaxStr}
          otherDeductionsStr={otherDeductionsStr}
          setOtherDeductionsStr={setOtherDeductionsStr}
          estimatedTaxStr={estimatedTaxStr}
          setEstimatedTaxStr={setEstimatedTaxStr}
          includeVariable={includeVariable}
          setIncludeVariable={setIncludeVariable}
          inputs={inputs}
          result={result}
          displayedInHand={displayedInHand}
          pct={pct}
          amt={amt}
          resetAll={resetAll}
        />
      ) : (
        <ReverseTab
          targetInHandStr={targetInHandStr}
          setTargetInHandStr={setTargetInHandStr}
          reverseCTC={reverseCTC}
          inputs={inputs}
        />
      )}

      {/* Disclaimer */}
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        {t('act3.disclaimer')}
      </p>
    </div>
  )
}

// ── Forward Tab ───────────────────────────────────────────────────────────────

interface ForwardTabProps {
  annualCTCStr: string
  setAnnualCTCStr: (v: string) => void
  fixedPctStr: string
  setFixedPctStr: (v: string) => void
  variablePctStr: string
  setVariablePctStr: (v: string) => void
  employerPctStr: string
  setEmployerPctStr: (v: string) => void
  basicPctStr: string
  setBasicPctStr: (v: string) => void
  hraPctStr: string
  setHraPctStr: (v: string) => void
  otherAllowancePctStr: string
  setOtherAllowancePctStr: (v: string) => void
  employeePFPctStr: string
  setEmployeePFPctStr: (v: string) => void
  professionalTaxStr: string
  setProfessionalTaxStr: (v: string) => void
  otherDeductionsStr: string
  setOtherDeductionsStr: (v: string) => void
  estimatedTaxStr: string
  setEstimatedTaxStr: (v: string) => void
  includeVariable: boolean
  setIncludeVariable: (v: boolean) => void
  inputs: SalaryInputs
  result: SalaryBreakdownResult
  displayedInHand: number
  pct: (s: string) => number
  amt: (s: string) => number
  resetAll: () => void
}

function ForwardTab({
  annualCTCStr, setAnnualCTCStr,
  fixedPctStr, setFixedPctStr,
  variablePctStr, setVariablePctStr,
  employerPctStr, setEmployerPctStr,
  basicPctStr, setBasicPctStr,
  hraPctStr, setHraPctStr,
  otherAllowancePctStr, setOtherAllowancePctStr,
  employeePFPctStr, setEmployeePFPctStr,
  professionalTaxStr, setProfessionalTaxStr,
  otherDeductionsStr, setOtherDeductionsStr,
  estimatedTaxStr, setEstimatedTaxStr,
  includeVariable, setIncludeVariable,
  inputs, result, displayedInHand,
  pct, amt, resetAll,
}: ForwardTabProps) {
  const { t } = useLanguage()
  const mainTotal = result.mainAllocationTotal
  const fixedTotal = result.fixedAllocationTotal

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Left: Inputs ── */}
      <div className="flex flex-col gap-4">
        {/* Presets */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t('act3.quickPresets')}
          </p>
          <div className="flex flex-wrap gap-2">
            {CTC_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setAnnualCTCStr(String(p.value))}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                  parseCTCInput(annualCTCStr) === p.value
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Annual CTC */}
        <SectionCard title={t('act3.annualCTC')}>
          <div className="flex items-center gap-2 py-1">
            <span className="text-lg font-semibold text-slate-500">₹</span>
            <input
              type="number"
              value={annualCTCStr}
              onChange={(e) => setAnnualCTCStr(e.target.value)}
              onBlur={(e) => setAnnualCTCStr(String(parseCTCInput(e.target.value)))}
              min={100000}
              max={10000000}
              step={1000}
              aria-label="Annual CTC"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-lg font-bold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          {inputs.annualCTC > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              = {formatINR(inputs.annualCTC)} per year
            </p>
          )}
        </SectionCard>

        {/* CTC Allocation */}
        <SectionCard
          title={t('act3.ctcAllocation')}
          status={<AllocationStatus total={mainTotal} />}
        >
          <PctInputRow
            label={t('act3.fixedSalary')}
            value={fixedPctStr}
            onChange={setFixedPctStr}
            onCommit={(v) => setFixedPctStr(String(pct(v)))}
            note={t('act3.noteFixed')}
          />
          <PctInputRow
            label={t('act3.variableBonus')}
            value={variablePctStr}
            onChange={setVariablePctStr}
            onCommit={(v) => setVariablePctStr(String(pct(v)))}
            note={t('act3.noteVariable')}
          />
          <PctInputRow
            label={t('act3.employerContrib')}
            value={employerPctStr}
            onChange={setEmployerPctStr}
            onCommit={(v) => setEmployerPctStr(String(pct(v)))}
            note={t('act3.noteEmployer')}
          />
        </SectionCard>

        {/* Fixed Salary Breakdown */}
        <SectionCard
          title={t('act3.fixedSalaryBreakdown')}
          status={<AllocationStatus total={fixedTotal} />}
        >
          <PctInputRow
            label={t('act3.basicPay')}
            value={basicPctStr}
            onChange={setBasicPctStr}
            onCommit={(v) => setBasicPctStr(String(pct(v)))}
            note={t('act3.noteBasic')}
          />
          <PctInputRow
            label={t('act3.hraAllowances')}
            value={hraPctStr}
            onChange={setHraPctStr}
            onCommit={(v) => setHraPctStr(String(pct(v)))}
            note={t('act3.noteHRA')}
          />
          <PctInputRow
            label={t('act3.otherAllowances')}
            value={otherAllowancePctStr}
            onChange={setOtherAllowancePctStr}
            onCommit={(v) => setOtherAllowancePctStr(String(pct(v)))}
            note={t('act3.noteOtherAllow')}
          />
        </SectionCard>

        {/* Employee Deductions */}
        <SectionCard title={t('act3.employeeDeductions')}>
          <PctInputRow
            label={t('act3.employeePF')}
            value={employeePFPctStr}
            onChange={setEmployeePFPctStr}
            onCommit={(v) => setEmployeePFPctStr(String(pct(v)))}
            note={t('act3.noteEPF')}
          />
          <AmountInputRow
            label={t('act3.professionalTax')}
            value={professionalTaxStr}
            onChange={setProfessionalTaxStr}
            onCommit={(v) => setProfessionalTaxStr(String(amt(v)))}
          />
          <AmountInputRow
            label={t('act3.otherDeductions')}
            value={otherDeductionsStr}
            onChange={setOtherDeductionsStr}
            onCommit={(v) => setOtherDeductionsStr(String(amt(v)))}
          />
          <AmountInputRow
            label={t('act3.estTaxTDS')}
            value={estimatedTaxStr}
            onChange={setEstimatedTaxStr}
            onCommit={(v) => setEstimatedTaxStr(String(amt(v)))}
          />
        </SectionCard>

        {/* Reset */}
        <button
          type="button"
          onClick={resetAll}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          {t('act3.resetSimulator')}
        </button>
      </div>

      {/* ── Right: Results ── */}
      <div className="flex flex-col gap-5">
        {/* Result cards */}
        <div className="grid grid-cols-2 gap-3">
          <ResultCard label={t('act3.annualCTCResult')} value={formatINR(inputs.annualCTC)} accent="slate" />
          <ResultCard label={t('act3.fixedAnnual')} value={formatINR(result.annualFixed)} accent="indigo" />
          <ResultCard label={t('act3.approxMonthlyGross')} value={formatINR(result.monthlyGross)} accent="indigo" />
          <ResultCard
            label={t('act3.approxMonthlyInHand')}
            value={formatINR(displayedInHand)}
            accent="emerald"
            large
            note={includeVariable ? 'Includes variable monthly equiv.' : 'Excludes variable/bonus payout'}
          />
          <ResultCard label={t('act3.variableBonus')} value={formatINR(result.annualVariable)} accent="amber" />
          <ResultCard label={t('act3.employerContrib')} value={formatINR(result.annualEmployerContrib)} accent="slate" />
          <ResultCard label="Monthly Deductions" value={formatINR(result.totalMonthlyDeductions)} accent="rose" />
          <ResultCard
            label="Monthly Variable Equiv."
            value={formatINR(result.annualVariableMonthlyEquiv)}
            accent="amber"
            note="For comparison only"
          />
        </div>

        {/* Variable toggle */}
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={includeVariable}
            onChange={(e) => setIncludeVariable(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
          />
          <span className="text-sm text-slate-700">Include variable pay in monthly equivalent</span>
        </label>

        {/* CTC Breakdown Bar */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            CTC Composition
          </h3>
          <CTCBreakdownBar
            fixedPct={inputs.fixedPct}
            variablePct={inputs.variablePct}
            employerPct={inputs.employerPct}
          />
        </div>

        {/* Salary Flow */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            Salary Flow
          </h3>
          <SalaryFlowCard
            ctc={inputs.annualCTC}
            fixedPct={inputs.fixedPct}
            annualFixed={result.annualFixed}
            monthlyGross={result.monthlyGross}
            totalDeductions={result.totalMonthlyDeductions}
            monthlyInHand={result.monthlyInHand}
            annualVariable={result.annualVariable}
            annualEmployer={result.annualEmployerContrib}
          />
        </div>

        {/* Deduction Breakdown */}
        <DeductionBreakdown
          result={result}
          profTax={inputs.professionalTaxMonthly}
          otherDed={inputs.otherDeductionsMonthly}
          taxDed={inputs.estimatedTaxMonthly}
        />
      </div>
    </div>
  )
}

// ── Reverse Tab ───────────────────────────────────────────────────────────────

interface ReverseTabProps {
  targetInHandStr: string
  setTargetInHandStr: (v: string) => void
  reverseCTC: number
  inputs: SalaryInputs
}

function ReverseTab({ targetInHandStr, setTargetInHandStr, reverseCTC, inputs }: ReverseTabProps) {
  const { t } = useLanguage()
  const target = parseAmountInput(targetInHandStr)
  const reverseResult = useMemo(
    () => calculateSalaryBreakdown({ ...inputs, annualCTC: reverseCTC }),
    [inputs, reverseCTC]
  )

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <SectionCard title={t('act3.targetMonthlyInHand')}>
        <div className="flex items-center gap-2 py-1">
          <span className="text-lg font-semibold text-slate-500">₹</span>
          <input
            type="number"
            value={targetInHandStr}
            onChange={(e) => setTargetInHandStr(e.target.value)}
            onBlur={(e) => setTargetInHandStr(String(parseAmountInput(e.target.value)))}
            min={0}
            step={1000}
            aria-label="Target monthly in-hand salary"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-lg font-bold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <span className="text-sm text-slate-400">/month</span>
        </div>
      </SectionCard>

      {target > 0 && reverseCTC > 0 ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-center">
            <p className="text-sm font-semibold text-indigo-600">{t('act3.estAnnualCTCRequired')}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-indigo-800">
              {formatINR(reverseCTC)}
            </p>
            <p className="mt-1 text-xs text-indigo-500">
              Based on your current salary structure assumptions
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ResultCard label={t('act3.estMonthlyGross')} value={formatINR(reverseResult.monthlyGross)} accent="indigo" />
            <ResultCard label={t('act3.approxMonthlyInHand')} value={formatINR(reverseResult.monthlyInHand)} accent="emerald" />
            <ResultCard label="Monthly Deductions" value={formatINR(reverseResult.totalMonthlyDeductions)} accent="rose" />
            <ResultCard label="Monthly Variable Equiv." value={formatINR(reverseResult.annualVariableMonthlyEquiv)} accent="amber" note="For comparison only" />
          </div>

          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-700">
            This estimate uses the salary structure (fixed %, deductions, etc.) you configured in the
            main tab. Adjust those assumptions there, then return here.
          </p>
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 px-4 py-4 text-center text-sm text-slate-400">
          Enter a target monthly in-hand amount above.
        </p>
      )}
    </div>
  )
}
