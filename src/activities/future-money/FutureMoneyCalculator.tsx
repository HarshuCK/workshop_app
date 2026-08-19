import { useState } from 'react'
import { FutureValueMode } from './FutureValueMode'
import { TargetWealthMode } from './TargetWealthMode'
import { ComparisonMode } from './ComparisonMode'
import { useLanguage } from '../../i18n/LanguageContext'

type Mode = 'future-value' | 'target-wealth' | 'comparison'

const MODE_IDS: Mode[] = ['future-value', 'target-wealth', 'comparison']

export function FutureMoneyCalculator() {
  const { t } = useLanguage()
  const [mode, setMode] = useState<Mode>('future-value')

  const MODES = MODE_IDS.map(id => ({
    id,
    label: t(`act1.modes.${id}.label`),
    question: t(`act1.modes.${id}.question`),
  }))

  const activeMode = MODES.find((m) => m.id === mode)!

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-1.5">
        <div className="grid grid-cols-3 gap-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition-all sm:px-3 ${
                mode === m.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode question */}
      <p className="text-center text-sm font-medium text-slate-500">{activeMode.question}</p>

      {/* Mode content */}
      {mode === 'future-value' && <FutureValueMode />}
      {mode === 'target-wealth' && <TargetWealthMode />}
      {mode === 'comparison' && <ComparisonMode />}

      {/* Disclaimer */}
      <p className="text-center text-xs leading-relaxed text-slate-400">
        {t('act1.disclaimer')}
      </p>
    </div>
  )
}
