import { useState, useEffect, useMemo } from 'react'
import type { CommunicationScenario, ScenarioQuestion, QuestionCategory } from '../../data/communicationScenarios'
import { getScenariosForDifficulty, DAYS_MR } from '../../data/communicationScenarios'
import { useLanguage } from '../../i18n/LanguageContext'

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = 'setup' | 'observe' | 'reconstruct' | 'compare'
type Difficulty = 1 | 2 | 3
type Mode = 'individual' | 'group'
type AnswerResult = 'correct' | 'changed' | 'unanswered'

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function checkAnswer(studentAnswer: string, question: ScenarioQuestion): AnswerResult {
  const norm = normalizeAnswer(studentAnswer)
  if (norm === '') return 'unanswered'
  if (question.type === 'number') {
    const sNum = parseFloat(studentAnswer)
    const cNum = parseFloat(question.correctAnswer)
    if (!isNaN(sNum) && !isNaN(cNum) && sNum === cNum) return 'correct'
    if (question.acceptableAnswers.some(a => parseFloat(a) === sNum)) return 'correct'
    return 'changed'
  }
  const correct = normalizeAnswer(question.correctAnswer)
  if (norm === correct) return 'correct'
  if (question.acceptableAnswers.some(a => normalizeAnswer(a) === norm)) return 'correct'
  return 'changed'
}

function pickScenario(difficulty: Difficulty, excludeId: string | null): CommunicationScenario {
  const pool = getScenariosForDifficulty(difficulty)
  const candidates = pool.length > 1 && excludeId ? pool.filter(s => s.id !== excludeId) : pool
  const source = candidates.length > 0 ? candidates : pool
  return source[Math.floor(Math.random() * source.length)]
}

// ── Stage Indicator ───────────────────────────────────────────────────────────

function StageIndicator({ stage }: { stage: Stage }) {
  const { t } = useLanguage()
  const steps = [
    { key: 'observe', label: t('act7.stage1') },
    { key: 'reconstruct', label: t('act7.stage2') },
    { key: 'compare', label: t('act7.stage3') },
  ]
  const active = ['observe', 'reconstruct', 'compare'].indexOf(stage)
  return (
    <div className="flex items-center gap-1" aria-label="Experiment progress">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          {i > 0 && <div className="mx-1.5 h-px w-6 bg-slate-200" aria-hidden="true" />}
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
            i === active ? 'bg-indigo-600 text-white' :
            i < active  ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-400'
          }`}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Countdown ─────────────────────────────────────────────────────────────────

function CountdownTimer({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) {
  const { t } = useLanguage()
  const pct = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0
  const urgent = timeLeft <= 4
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        aria-label={`${timeLeft} seconds remaining`}
        className={`text-5xl font-bold tabular-nums sm:text-7xl ${urgent ? 'text-red-600' : 'text-slate-800'}`}
      >
        {timeLeft}
      </div>
      <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-100">
        <div
          aria-hidden="true"
          className={`h-full rounded-full transition-all duration-1000 ${urgent ? 'bg-red-400' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">{t('act7.secondsRemaining')}</p>
    </div>
  )
}

// ── Question Input ────────────────────────────────────────────────────────────

function QuestionInput({ question, value, onChange }: {
  question: ScenarioQuestion
  value: string
  onChange: (v: string) => void
}) {
  const { lang, t } = useLanguage()

  if (question.type === 'radio' && question.options) {
    const displayOptions = lang === 'mr' && question.optionsMr ? question.optionsMr : question.options
    return (
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`label-${question.id}`}>
        {question.options.map((opt, i) => {
          const displayLabel = displayOptions[i] ?? opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(value === opt ? '' : opt)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                value === opt
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              {displayLabel}
            </button>
          )
        })}
      </div>
    )
  }
  if (question.type === 'select' && question.options) {
    const DAYS = question.options
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-labelledby={`label-${question.id}`}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      >
        <option value="">{t('act7.selectPlaceholder')}</option>
        {DAYS.map((opt, i) => {
          const displayLabel = lang === 'mr' ? (DAYS_MR[i] ?? opt) : opt
          return (
            <option key={opt} value={opt}>{displayLabel}</option>
          )
        })}
      </select>
    )
  }
  if (question.type === 'number') {
    const ph = lang === 'mr' ? (question.placeholderMr ?? t('act7.enterNumber')) : (question.placeholder ?? t('act7.enterNumber'))
    return (
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={ph}
        aria-labelledby={`label-${question.id}`}
        min={0}
        className="w-36 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
    )
  }
  const ph = lang === 'mr' ? (question.placeholderMr ?? t('act7.typeAnswer')) : (question.placeholder ?? t('act7.typeAnswer'))
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={ph}
      aria-labelledby={`label-${question.id}`}
      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    />
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CommunicationExperiment() {
  const { lang, t } = useLanguage()
  const [stage, setStage] = useState<Stage>('setup')
  const [difficulty, setDifficulty] = useState<Difficulty>(2)
  const [mode, setMode] = useState<Mode>('individual')
  const [scenario, setScenario] = useState<CommunicationScenario | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [lastId, setLastId] = useState<string | null>(null)

  function categoryLabel(cat: QuestionCategory): string {
    const key = `act7.catLabels.${cat}` as const
    return t(key)
  }

  // Timer — one setTimeout per tick to avoid drift; cleans up on unmount/stage change
  useEffect(() => {
    if (stage !== 'observe') return
    if (timeLeft <= 0) { setStage('reconstruct'); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [stage, timeLeft])

  function launch(diff: Difficulty, excludeId: string | null) {
    const s = pickScenario(diff, excludeId)
    setScenario(s)
    setLastId(s.id)
    setAnswers({})
    setTimeLeft(s.displaySeconds)
    setStage('observe')
  }

  const setAnswer = (id: string, v: string) => setAnswers(prev => ({ ...prev, [id]: v }))

  // Results (only computed in compare stage)
  const results = useMemo(() => {
    if (!scenario || stage !== 'compare') return []
    return scenario.questions.map(q => ({
      q,
      studentAnswer: answers[q.id] ?? '',
      result: checkAnswer(answers[q.id] ?? '', q) as AnswerResult,
    }))
  }, [scenario, stage, answers])

  const stats = useMemo(() => {
    const correct  = results.filter(r => r.result === 'correct').length
    const changed  = results.filter(r => r.result === 'changed').length
    const unanswered = results.filter(r => r.result === 'unanswered').length
    const total    = results.length
    const pct      = total > 0 ? (correct / total) * 100 : 0
    return { correct, changed, unanswered, total, pct }
  }, [results])

  const catResults = useMemo(() => {
    const map: Partial<Record<QuestionCategory, AnswerResult[]>> = {}
    for (const r of results) {
      if (!map[r.q.category]) map[r.q.category] = []
      map[r.q.category]!.push(r.result)
    }
    return map
  }, [results])

  // ── Setup ────────────────────────────────────────────────────────────────
  if (stage === 'setup') {
    const diffInfo = [
      { d: 1 as Difficulty, label: t('act7.levels.level1.label'), detail: t('act7.levels.level1.detail') },
      { d: 2 as Difficulty, label: t('act7.levels.level2.label'), detail: t('act7.levels.level2.detail') },
      { d: 3 as Difficulty, label: t('act7.levels.level3.label'), detail: t('act7.levels.level3.detail') },
    ]
    return (
      <div className="mx-auto max-w-lg space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">{t('act7.heading')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {mode === 'individual' ? t('act7.descIndividual') : t('act7.descGroup')}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('act7.difficultyLabel')}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {diffInfo.map(({ d, label, detail }) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  difficulty === d ? 'border-indigo-400 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-indigo-200'
                }`}
              >
                <p className={`text-sm font-bold ${difficulty === d ? 'text-indigo-700' : 'text-slate-800'}`}>{label}</p>
                <p className="mt-1 text-xs text-slate-500">{detail}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('act7.modeLabel')}</p>
          <div className="flex gap-3">
            {(['individual', 'group'] as Mode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  mode === m ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
                }`}
              >
                {m === 'individual' ? t('act7.modeIndividual') : t('act7.modeGroup')}
              </button>
            ))}
          </div>
          {mode === 'group' && (
            <p className="text-xs text-slate-400">{t('act7.modeGroupHint')}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => launch(difficulty, null)}
          className="w-full rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-lg transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
        >
          {t('act7.startExperiment')}
        </button>
      </div>
    )
  }

  // ── Observe ──────────────────────────────────────────────────────────────
  if (stage === 'observe' && scenario) {
    const displayMessage = lang === 'mr' && scenario.messageMr ? scenario.messageMr : scenario.message
    return (
      <div className="space-y-6">
        <StageIndicator stage={stage} />
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md sm:p-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              {mode === 'group' ? t('act7.readCarefullyGroup') : t('act7.readCarefully')}
            </p>
            <p className="text-base leading-relaxed text-slate-900 sm:text-lg">
              {displayMessage}
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <CountdownTimer timeLeft={timeLeft} totalTime={scenario.displaySeconds} />
            <button
              type="button"
              onClick={() => setStage('reconstruct')}
              className="mt-2 w-full rounded-xl border border-indigo-200 bg-indigo-50 py-3 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
            >
              {t('act7.readyHide')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Reconstruct ──────────────────────────────────────────────────────────
  if (stage === 'reconstruct' && scenario) {
    return (
      <div className="space-y-6">
        <StageIndicator stage={stage} />
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t('act7.reconstruct')}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'group' ? t('act7.reconstructDescGroup') : t('act7.reconstructDesc')}
          </p>
        </div>
        <div className="space-y-3">
          {scenario.questions.map((q, i) => {
            const label = lang === 'mr' && q.labelMr ? q.labelMr : q.label
            return (
              <div key={q.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <p id={`label-${q.id}`} className="mb-2.5 text-sm font-semibold text-slate-800">
                  <span className="mr-2 text-xs font-bold text-slate-400">{i + 1}.</span>
                  {label}
                </p>
                <QuestionInput question={q} value={answers[q.id] ?? ''} onChange={v => setAnswer(q.id, v)} />
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => setStage('compare')}
          className="w-full rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-lg transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
        >
          {t('act7.compareRecall')}
        </button>
      </div>
    )
  }

  // ── Compare ──────────────────────────────────────────────────────────────
  if (stage === 'compare' && scenario) {
    const catOrder: QuestionCategory[] = ['who', 'what', 'where', 'when', 'quantity', 'condition']

    return (
      <div className="space-y-6">
        <StageIndicator stage={stage} />

        {/* Score */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">{t('act7.factualMatch')}</p>
          <p className="mt-1 text-5xl font-bold tabular-nums text-indigo-700">{stats.pct.toFixed(0)}%</p>
          <p className="mt-2 text-sm text-slate-700">
            {stats.correct} {t('act7.detailsMatched')} {stats.total} {t('act7.detailsMatchedSuffix')}
            {stats.changed > 0 && <> {stats.changed} {stats.changed === 1 ? t('act7.detailChanged') : t('act7.detailsChanged')}</>}
            {stats.unanswered > 0 && <> {stats.unanswered} {stats.unanswered === 1 ? t('act7.fieldNotAnswered') : t('act7.fieldsNotAnswered')}</>}
          </p>
        </div>

        {/* Counts */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.correct}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{t('act7.correct')}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.changed}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{t('act7.changed')}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-500">{stats.unanswered}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{t('act7.notAnswered')}</p>
          </div>
        </div>

        {/* Distortion bar */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('act7.infoBreakdown')}</p>
          <div className="flex h-4 overflow-hidden rounded-full" aria-hidden="true">
            <div className="bg-emerald-500 transition-all" style={{ width: `${(stats.correct / stats.total) * 100}%` }} />
            <div className="bg-amber-400 transition-all" style={{ width: `${(stats.changed / stats.total) * 100}%` }} />
            <div className="bg-slate-200 transition-all" style={{ width: `${(stats.unanswered / stats.total) * 100}%` }} />
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" aria-hidden="true" />{t('act7.correct')}</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" aria-hidden="true" />{t('act7.changed')}</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-200" aria-hidden="true" />{t('act7.notAnsweredLower')}</span>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {catOrder.map(cat => {
            const res = catResults[cat]
            if (!res || res.length === 0) return null
            const correctCount = res.filter(r => r === 'correct').length
            const allCorrect = correctCount === res.length
            return (
              <div key={cat} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${allCorrect ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}>
                <span aria-hidden="true" className={`text-base font-bold ${allCorrect ? 'text-emerald-600' : 'text-amber-600'}`}>{allCorrect ? '✓' : '✕'}</span>
                <span className={`text-sm font-semibold ${allCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>{categoryLabel(cat)}</span>
                <span className="ml-auto text-xs text-slate-400">{correctCount}/{res.length}</span>
              </div>
            )
          })}
        </div>

        {/* Original vs Your Answer — desktop table */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{t('act7.originalVsYours')}</p>

          <div className="hidden overflow-x-auto rounded-xl border border-slate-100 sm:block">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[t('act7.detail'), t('act7.original'), t('act7.yourAnswer'), t('act7.match')].map(h => (
                    <th key={h} scope="col" className={`px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 ${h === t('act7.match') ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {results.map(({ q, studentAnswer, result }) => {
                  const label = lang === 'mr' && q.labelMr ? q.labelMr : q.label
                  return (
                    <tr key={q.id} className={result === 'correct' ? 'bg-emerald-50/40' : result === 'changed' ? 'bg-amber-50/40' : ''}>
                      <td className="px-4 py-2.5 text-xs font-semibold text-slate-500">{label}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{q.correctAnswer}</td>
                      <td className="px-4 py-2.5 text-slate-700">{studentAnswer || <span className="italic text-slate-400">—</span>}</td>
                      <td className="px-4 py-2.5 text-center">
                        {result === 'correct'    && <span className="font-bold text-emerald-600" aria-label="Correct">✓</span>}
                        {result === 'changed'    && <span className="font-bold text-amber-600"   aria-label="Different">✕</span>}
                        {result === 'unanswered' && <span className="text-slate-400"             aria-label="Not answered">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {results.map(({ q, studentAnswer, result }) => {
              const label = lang === 'mr' && q.labelMr ? q.labelMr : q.label
              return (
                <div key={q.id} className={`rounded-xl border p-3 ${result === 'correct' ? 'border-emerald-100 bg-emerald-50' : result === 'changed' ? 'border-amber-100 bg-amber-50' : 'border-slate-100 bg-white'}`}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-600">{label}</p>
                    <span aria-label={result === 'correct' ? 'Correct' : result === 'changed' ? 'Different' : 'Not answered'} className="flex-shrink-0 font-bold">
                      {result === 'correct' ? <span className="text-emerald-600">✓</span> : result === 'changed' ? <span className="text-amber-600">✕</span> : <span className="text-slate-400">—</span>}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><p className="font-semibold text-slate-400">{t('act7.original')}</p><p className="font-medium text-slate-900">{q.correctAnswer}</p></div>
                    <div><p className="font-semibold text-slate-400">{t('act7.yourAnswer')}</p><p className={studentAnswer ? 'text-slate-800' : 'italic text-slate-400'}>{studentAnswer || t('act7.notAnsweredItalic')}</p></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => launch(difficulty, lastId)}
            className="flex-1 rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
          >
            {t('act7.tryAnother')}
          </button>
          <button
            type="button"
            onClick={() => { setStage('setup'); setScenario(null); setAnswers({}); setLastId(null) }}
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
          >
            {t('act7.changeDifficulty')}
          </button>
        </div>

        <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
          {t('act7.disclaimer')}
        </p>
      </div>
    )
  }

  return null
}
