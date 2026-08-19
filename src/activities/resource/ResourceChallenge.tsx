import { useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Shuffle, RotateCcw, ChevronDown, ChevronUp, AlertTriangle, Sparkles } from 'lucide-react'
import { formatINR } from '../../utils/finance'
import {
  RESOURCE_SCENARIOS,
  SCENARIO_EVENTS,
} from '../../data/resourceScenarios'
import type {
  ResourceScenario,
  CategoryAllocation,
  ScenarioEvent,
} from '../../data/resourceScenarios'

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = 'select' | 'allocate'
type AllocMap = Record<string, CategoryAllocation>
type Resource = 'budget' | 'team' | 'effort'

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyAlloc(scenario: ResourceScenario): AllocMap {
  const map: AllocMap = {}
  for (const cat of scenario.categories) {
    map[cat.id] = { budget: 0, team: 0, effort: 0 }
  }
  return map
}

function minimumsAlloc(scenario: ResourceScenario): AllocMap {
  const map: AllocMap = {}
  for (const cat of scenario.categories) {
    map[cat.id] = {
      budget: cat.minimumBudget,
      team: cat.minimumTeam,
      effort: cat.minimumEffort,
    }
  }
  return map
}

function totalUsed(allocations: AllocMap, resource: Resource): number {
  return Object.values(allocations).reduce((s, a) => s + a[resource], 0)
}

function meetsMinimum(
  allocation: CategoryAllocation,
  scenario: ResourceScenario,
  catId: string
): boolean {
  const cat = scenario.categories.find(c => c.id === catId)
  if (!cat) return false
  return (
    allocation.budget >= cat.minimumBudget &&
    allocation.team >= cat.minimumTeam &&
    allocation.effort >= cat.minimumEffort
  )
}

function effectiveCap(scenario: ResourceScenario, event: ScenarioEvent | null) {
  return {
    budget: scenario.resources.budget + (event?.budgetDelta ?? 0),
    team: scenario.resources.team + (event?.teamDelta ?? 0),
    effort: scenario.resources.effort + (event?.effortDelta ?? 0),
  }
}

function pickRandomEvent(current: ScenarioEvent | null): ScenarioEvent {
  const pool = current
    ? SCENARIO_EVENTS.filter(e => e.id !== current.id)
    : SCENARIO_EVENTS
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ResourceMeter({
  label,
  used,
  cap,
  format,
  color,
}: {
  label: string
  used: number
  cap: number
  format: (v: number) => string
  color: string
}) {
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0
  const over = used > cap
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between mb-1 gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        <span className={`text-xs font-bold tabular-nums ${over ? 'text-red-600' : 'text-slate-700'}`}>
          {format(used)} / {format(cap)}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            backgroundColor: over ? '#ef4444' : color,
          }}
        />
      </div>
      <div className="mt-1 text-right text-xs text-slate-400">
        {format(Math.max(0, cap - used))} remaining
      </div>
    </div>
  )
}

function StepButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled: boolean
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  )
}

function ResourceRow({
  resource,
  label,
  value,
  minimum,
  format,
  onDecrement,
  onIncrement,
  canIncrement,
}: {
  resource: Resource
  label: string
  value: number
  minimum: number
  format: (v: number) => string
  onDecrement: (r: Resource) => void
  onIncrement: (r: Resource) => void
  canIncrement: boolean
}) {
  const metMin = value >= minimum
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-20 text-xs text-slate-500 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5">
        <StepButton onClick={() => onDecrement(resource)} disabled={value <= 0}>
          <span className="text-base leading-none">−</span>
        </StepButton>
        <span className="w-16 text-center text-sm font-semibold tabular-nums text-slate-800">
          {format(value)}
        </span>
        <StepButton onClick={() => onIncrement(resource)} disabled={!canIncrement}>
          <span className="text-base leading-none">+</span>
        </StepButton>
      </div>
      <span className="ml-auto text-xs text-slate-400 shrink-0">
        min {format(minimum)}
      </span>
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${
          metMin ? 'bg-green-400' : 'bg-slate-200'
        }`}
      />
    </div>
  )
}

// ── ScenarioSelector ──────────────────────────────────────────────────────────

function ScenarioSelector({ onSelect }: { onSelect: (s: ResourceScenario) => void }) {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Choose a Scenario</h2>
        <p className="text-sm text-slate-500">
          Pick one situation and allocate your resources across key areas.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {RESOURCE_SCENARIOS.map(s => {
          const catCount = s.categories.length
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="text-left rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200 group"
            >
              <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">
                {s.title}
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">{s.tagline}</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Budget</span>
                  <span className="font-semibold text-slate-700">{formatINR(s.resources.budget)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Team size</span>
                  <span className="font-semibold text-slate-700">{s.resources.team} people</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Effort pool</span>
                  <span className="font-semibold text-slate-700">{s.resources.effort} pts</span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Areas to cover</span>
                  <span className="font-semibold text-slate-700">{catCount}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── CategoryCard ──────────────────────────────────────────────────────────────

function CategoryCard({
  catId,
  catName,
  catDesc,
  catColor,
  allocation,
  minBudget,
  minTeam,
  minEffort,
  canIncrementBudget,
  canIncrementTeam,
  canIncrementEffort,
  onDecrement,
  onIncrement,
  metMin,
}: {
  catId: string
  catName: string
  catDesc: string
  catColor: string
  allocation: CategoryAllocation
  minBudget: number
  minTeam: number
  minEffort: number
  canIncrementBudget: boolean
  canIncrementTeam: boolean
  canIncrementEffort: boolean
  onDecrement: (catId: string, r: Resource) => void
  onIncrement: (catId: string, r: Resource) => void
  metMin: boolean
}) {
  const [open, setOpen] = useState(true)

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        metMin ? 'border-green-200 bg-green-50/40' : 'border-slate-200 bg-white'
      }`}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: catColor }}
        />
        <span className="flex-1 font-semibold text-sm text-slate-800">{catName}</span>
        {metMin && (
          <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
            ✓ Covered
          </span>
        )}
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4">
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">{catDesc}</p>
          <div className="divide-y divide-slate-100">
            <ResourceRow
              resource="budget"
              label="Budget"
              value={allocation.budget}
              minimum={minBudget}
              format={v => formatINR(v)}
              onDecrement={r => onDecrement(catId, r)}
              onIncrement={r => onIncrement(catId, r)}
              canIncrement={canIncrementBudget}
            />
            <ResourceRow
              resource="team"
              label="Team"
              value={allocation.team}
              minimum={minTeam}
              format={v => `${v}p`}
              onDecrement={r => onDecrement(catId, r)}
              onIncrement={r => onIncrement(catId, r)}
              canIncrement={canIncrementTeam}
            />
            <ResourceRow
              resource="effort"
              label="Effort"
              value={allocation.effort}
              minimum={minEffort}
              format={v => `${v} pts`}
              onDecrement={r => onDecrement(catId, r)}
              onIncrement={r => onIncrement(catId, r)}
              canIncrement={canIncrementEffort}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── AllocationSummaryTable ────────────────────────────────────────────────────

function AllocationSummaryTable({
  scenario,
  allocations,
}: {
  scenario: ResourceScenario
  allocations: AllocMap
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Area</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">Budget</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">Team</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">Effort</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">Status</th>
          </tr>
        </thead>
        <tbody>
          {scenario.categories.map(cat => {
            const alloc = allocations[cat.id] ?? { budget: 0, team: 0, effort: 0 }
            const met = meetsMinimum(alloc, scenario, cat.id)
            return (
              <tr key={cat.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-medium text-slate-700">{cat.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                  {formatINR(alloc.budget)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                  {alloc.team}p
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                  {alloc.effort} pts
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      met
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {met ? 'Covered' : 'Needs more'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── AllocationView ────────────────────────────────────────────────────────────

function AllocationView({
  scenario,
  onChangeScenario,
}: {
  scenario: ResourceScenario
  onChangeScenario: () => void
}) {
  const [allocations, setAllocations] = useState<AllocMap>(() => emptyAlloc(scenario))
  const [activeEvent, setActiveEvent] = useState<ScenarioEvent | null>(null)
  const [showResult, setShowResult] = useState(false)

  const cap = useMemo(() => effectiveCap(scenario, activeEvent), [scenario, activeEvent])

  const usedBudget = useMemo(() => totalUsed(allocations, 'budget'), [allocations])
  const usedTeam = useMemo(() => totalUsed(allocations, 'team'), [allocations])
  const usedEffort = useMemo(() => totalUsed(allocations, 'effort'), [allocations])

  const coveredCount = useMemo(
    () => scenario.categories.filter(c => meetsMinimum(allocations[c.id] ?? { budget: 0, team: 0, effort: 0 }, scenario, c.id)).length,
    [allocations, scenario]
  )
  const totalCats = scenario.categories.length
  const allCovered = coveredCount === totalCats

  function handleAdjust(catId: string, resource: Resource, delta: number) {
    setAllocations(prev => {
      const current = prev[catId] ?? { budget: 0, team: 0, effort: 0 }
      const newVal = Math.max(0, current[resource] + delta)
      const otherUsed = Object.entries(prev)
        .filter(([id]) => id !== catId)
        .reduce((s, [, a]) => s + a[resource], 0)
      const maxAllowed = Math.max(0, cap[resource] - otherUsed)
      const clamped = Math.min(newVal, maxAllowed)
      return { ...prev, [catId]: { ...current, [resource]: clamped } }
    })
  }

  function handleIncrement(catId: string, resource: Resource) {
    const step = resource === 'budget' ? 1000 : resource === 'team' ? 1 : 5
    handleAdjust(catId, resource, step)
  }

  function handleDecrement(catId: string, resource: Resource) {
    const step = resource === 'budget' ? 1000 : resource === 'team' ? 1 : 5
    handleAdjust(catId, resource, -step)
  }

  function canIncrement(catId: string, resource: Resource): boolean {
    const step = resource === 'budget' ? 1000 : resource === 'team' ? 1 : 5
    const current = (allocations[catId] ?? { budget: 0, team: 0, effort: 0 })[resource]
    const otherUsed = Object.entries(allocations)
      .filter(([id]) => id !== catId)
      .reduce((s, [, a]) => s + a[resource], 0)
    return current + step <= cap[resource] - otherUsed
  }

  function applyMinimums() {
    setAllocations(minimumsAlloc(scenario))
    setShowResult(false)
  }

  function clearAll() {
    setAllocations(emptyAlloc(scenario))
    setShowResult(false)
  }

  function drawEvent() {
    const evt = pickRandomEvent(activeEvent)
    setActiveEvent(evt)
    // Clamp existing allocations to new cap after event
    setAllocations(prev => {
      const newCap = effectiveCap(scenario, evt)
      const result: AllocMap = {}
      for (const cat of scenario.categories) {
        const alloc = prev[cat.id] ?? { budget: 0, team: 0, effort: 0 }
        // We need to clamp but can't do per-category without context of others
        // Just keep as-is; the UI prevents further over-allocation
        result[cat.id] = alloc
      }
      // Proportionally clamp if any resource is over cap
      for (const r of ['budget', 'team', 'effort'] as Resource[]) {
        const used = Object.values(result).reduce((s, a) => s + a[r], 0)
        if (used > newCap[r] && used > 0) {
          const ratio = newCap[r] / used
          for (const cat of scenario.categories) {
            const raw = result[cat.id][r] * ratio
            // round to nearest step
            const step = r === 'budget' ? 1000 : r === 'team' ? 1 : 5
            result[cat.id] = { ...result[cat.id], [r]: Math.floor(raw / step) * step }
          }
        }
      }
      return result
    })
    setShowResult(false)
  }

  function resetEvent() {
    setActiveEvent(null)
    setShowResult(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{scenario.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{scenario.tagline}</p>
        </div>
        <button
          onClick={onChangeScenario}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-colors"
        >
          Change Scenario
        </button>
      </div>

      {/* Event banner */}
      {activeEvent && (
        <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-amber-800 text-sm mb-1">{activeEvent.label}</div>
            <p className="text-xs text-amber-700 leading-relaxed">{activeEvent.description}</p>
          </div>
          <button
            onClick={resetEvent}
            className="text-xs text-amber-600 hover:text-amber-800 font-medium shrink-0 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed mb-5 bg-slate-50 rounded-xl px-4 py-3">
        {scenario.description}
      </p>

      {/* Resource overview */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
          Resource Overview
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <ResourceMeter
            label="Budget"
            used={usedBudget}
            cap={cap.budget}
            format={v => formatINR(v)}
            color="#6366f1"
          />
          <ResourceMeter
            label="Team"
            used={usedTeam}
            cap={cap.team}
            format={v => `${v} people`}
            color="#3b82f6"
          />
          <ResourceMeter
            label="Effort"
            used={usedEffort}
            cap={cap.effort}
            format={v => `${v} pts`}
            color="#10b981"
          />
        </div>
      </div>

      {/* Coverage status */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">
            {coveredCount} / {totalCats} areas meet minimum requirements
          </span>
          {allCovered && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              All covered
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={applyMinimums}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Apply Minimums
          </button>
          <button
            onClick={clearAll}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 bg-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={drawEvent}
            className="text-xs font-medium text-amber-700 hover:text-amber-900 border border-amber-200 hover:border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Draw a Situation
          </button>
        </div>
      </div>

      {/* Main layout: cards left, summary right on desktop */}
      <div className="lg:flex lg:gap-6">
        {/* Category cards */}
        <div className="flex-1 space-y-3 min-w-0">
          {scenario.categories.map(cat => {
            const alloc = allocations[cat.id] ?? { budget: 0, team: 0, effort: 0 }
            const met = meetsMinimum(alloc, scenario, cat.id)
            return (
              <CategoryCard
                key={cat.id}
                catId={cat.id}
                catName={cat.name}
                catDesc={cat.description}
                catColor={cat.color}
                allocation={alloc}
                minBudget={cat.minimumBudget}
                minTeam={cat.minimumTeam}
                minEffort={cat.minimumEffort}
                canIncrementBudget={canIncrement(cat.id, 'budget')}
                canIncrementTeam={canIncrement(cat.id, 'team')}
                canIncrementEffort={canIncrement(cat.id, 'effort')}
                onDecrement={handleDecrement}
                onIncrement={handleIncrement}
                metMin={met}
              />
            )
          })}
        </div>

        {/* Desktop sidebar: summary table + result */}
        <div className="hidden lg:block lg:w-80 shrink-0 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sticky top-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
              Allocation Summary
            </h3>
            <AllocationSummaryTable scenario={scenario} allocations={allocations} />

            {/* Totals */}
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total budget used</span>
                <span className="font-semibold text-slate-700">{formatINR(usedBudget)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total team assigned</span>
                <span className="font-semibold text-slate-700">{usedTeam}p</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total effort used</span>
                <span className="font-semibold text-slate-700">{usedEffort} pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result card when all covered */}
      {allCovered && !showResult && (
        <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-center">
          <div className="text-2xl mb-2">🎉</div>
          <h3 className="text-base font-bold text-indigo-900 mb-2">
            All areas are covered!
          </h3>
          <p className="text-sm text-indigo-700 leading-relaxed max-w-md mx-auto mb-4">
            Every area meets its minimum resource requirement. Consider whether some areas could
            benefit from more resources, or whether you want to keep a larger buffer elsewhere.
          </p>
          <button
            onClick={() => setShowResult(true)}
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 border border-indigo-300 hover:border-indigo-400 bg-white px-4 py-2 rounded-xl transition-colors"
          >
            View Full Allocation Breakdown
          </button>
        </div>
      )}

      {showResult && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Your Full Allocation</h3>
          <AllocationSummaryTable scenario={scenario} allocations={allocations} />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="text-center rounded-xl bg-indigo-50 px-3 py-3">
              <div className="text-xs text-indigo-500 mb-1">Budget used</div>
              <div className="font-bold text-indigo-800 text-sm tabular-nums">{formatINR(usedBudget)}</div>
              <div className="text-xs text-indigo-400 mt-0.5">of {formatINR(cap.budget)}</div>
            </div>
            <div className="text-center rounded-xl bg-blue-50 px-3 py-3">
              <div className="text-xs text-blue-500 mb-1">Team assigned</div>
              <div className="font-bold text-blue-800 text-sm tabular-nums">{usedTeam}p</div>
              <div className="text-xs text-blue-400 mt-0.5">of {cap.team} people</div>
            </div>
            <div className="text-center rounded-xl bg-green-50 px-3 py-3">
              <div className="text-xs text-green-500 mb-1">Effort used</div>
              <div className="font-bold text-green-800 text-sm tabular-nums">{usedEffort} pts</div>
              <div className="text-xs text-green-400 mt-0.5">of {cap.effort} pts</div>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500 leading-relaxed">
            This is your allocation plan. There is no single correct answer — different teams
            make different trade-offs based on their priorities, risk tolerance, and context.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ResourceChallenge() {
  const [stage, setStage] = useState<Stage>('select')
  const [scenario, setScenario] = useState<ResourceScenario | null>(null)

  function handleSelect(s: ResourceScenario) {
    setScenario(s)
    setStage('allocate')
  }

  function handleChangeScenario() {
    setScenario(null)
    setStage('select')
  }

  return (
    <div>
      {stage === 'select' && <ScenarioSelector onSelect={handleSelect} />}
      {stage === 'allocate' && scenario && (
        <AllocationView scenario={scenario} onChangeScenario={handleChangeScenario} />
      )}
    </div>
  )
}
