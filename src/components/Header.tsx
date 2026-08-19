import { Lightbulb } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageContainer } from './PageContainer'
import { useLanguage } from '../i18n/LanguageContext'

export function Header() {
  const { lang, setLang, t } = useLanguage()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <PageContainer>
        <div className="flex h-16 items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            aria-label="Career Katta Workshop Lab – Home"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600">
              <Lightbulb className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-slate-900">Career Katta</span>
              <span className="text-xs font-semibold text-indigo-600">Workshop Lab</span>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {t('header.activities')}
            </span>

            <div className="flex overflow-hidden rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
                  lang === 'en'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t('header.langEN')}
              </button>
              <button
                type="button"
                onClick={() => setLang('mr')}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
                  lang === 'mr'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t('header.langMR')}
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    </header>
  )
}
