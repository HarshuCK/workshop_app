import { useLanguage } from '../i18n/LanguageContext'

export function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs text-slate-400">
          {t('footer.developedBy')}
        </p>
      </div>
    </footer>
  )
}
