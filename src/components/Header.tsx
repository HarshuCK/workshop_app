import { Link } from 'react-router-dom'
import { PageContainer } from './PageContainer'
import { useLanguage } from '../i18n/LanguageContext'
import careerKattaLogo from '../assets/career_katta_logo.png'
import mitscLogo from '../assets/mitsc_logo.png'

export function Header() {
  const { lang, setLang, t } = useLanguage()

  const langBtn = (code: 'en' | 'mr', label: string) => (
    <button
      type="button"
      onClick={() => setLang(code)}
      className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
        lang === code
          ? 'bg-indigo-600 text-white'
          : 'bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )

  const langSwitcher = (
    <div className="flex overflow-hidden rounded-lg border border-slate-200">
      {langBtn('en', t('header.langEN'))}
      {langBtn('mr', t('header.langMR'))}
    </div>
  )

  const activitiesBadge = (
    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 whitespace-nowrap">
      {t('header.activities')}
    </span>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <PageContainer>
        {/*
         * Mobile  (<sm): two rows — logos+brand on top, utilities below.
         * Desktop (≥sm): single h-16 row.
         */}
        <div className="py-2 sm:flex sm:h-16 sm:items-center sm:py-0">

          {/* ── Primary row ─────────────────────────────────────────── */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Career Katta logo + brand text */}
            <Link
              to="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80 flex-shrink-0"
              aria-label="Career Katta Workshop Lab – Home"
            >
              <img
                src={careerKattaLogo}
                alt="Career Katta"
                className="h-8 w-8 sm:h-9 sm:w-9 object-contain flex-shrink-0"
              />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-slate-900">Career Katta</span>
                <span className="text-xs font-semibold text-indigo-600">Workshop Lab</span>
              </div>
            </Link>

            {/* Spacer */}
            <div className="flex-1 min-w-0" />

            {/* MITSC logo — always in the primary row */}
            <img
              src={mitscLogo}
              alt="MITSC"
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain flex-shrink-0"
            />

            {/* Desktop-only: thin divider + utilities */}
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3">
              {activitiesBadge}
              {langSwitcher}
            </div>
          </div>

          {/* ── Mobile-only utility row ──────────────────────────────── */}
          <div className="mt-1.5 flex items-center justify-end gap-2 sm:hidden">
            {activitiesBadge}
            {langSwitcher}
          </div>

        </div>
      </PageContainer>
    </header>
  )
}
