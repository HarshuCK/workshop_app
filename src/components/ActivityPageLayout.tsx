import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { Activity } from '../data/activities'
import { Button } from './Button'
import { Header } from './Header'
import { Footer } from './Footer'
import { PageContainer } from './PageContainer'
import { useLanguage } from '../i18n/LanguageContext'

interface ActivityPageLayoutProps {
  activity: Activity
  children: ReactNode
  wide?: boolean
}

export function ActivityPageLayout({ activity, children, wide = false }: ActivityPageLayoutProps) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const Icon = activity.icon

  const title = t(`activities.${activity.id}.title`)
  const category = t(`activities.${activity.id}.category`)
  const shortDescription = t(`activities.${activity.id}.shortDescription`)

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="border-b border-slate-100 bg-white py-3">
        <PageContainer>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            aria-label={t('nav.backToActivitiesLabel')}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('nav.backToActivities')}
          </Button>
        </PageContainer>
      </div>

      <PageContainer className="py-10 sm:py-14">
        <div className={`mx-auto ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}>
          {/* Activity header */}
          <div className="mb-8 text-center">
            <div
              className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${activity.colors.iconBg}`}
            >
              <Icon
                className={`h-8 w-8 ${activity.colors.iconText}`}
                strokeWidth={1.75}
              />
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              {t('activityPage.activityLabel')} {String(activity.number).padStart(2, '0')}
            </p>

            <h1 className="mb-3 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>

            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${activity.colors.tagBg} ${activity.colors.tagText}`}
            >
              {category}
            </span>

            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-500">
              {shortDescription}
            </p>
          </div>

          {/* Page-specific content */}
          {children}
        </div>
      </PageContainer>

      <Footer />
    </div>
  )
}
