import { Zap } from 'lucide-react'
import { activities } from '../data/activities'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { PageContainer } from '../components/PageContainer'
import { ActivityCard } from '../components/ActivityCard'
import { SectionHeading } from '../components/SectionHeading'
import { useLanguage } from '../i18n/LanguageContext'
import bannerImg from '../assets/career_katta_banner.jpeg'

export default function HomePage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Hero */}
      <div className="border-b border-slate-100 bg-white">
        <PageContainer className="py-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              {t('home.badge')}
            </div>
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Career Katta{' '}
              <span className="text-indigo-600">Workshop Lab</span>
            </h1>
            <p className="text-lg text-slate-500">
              {t('home.tagline')}
            </p>
          </div>
        </PageContainer>
      </div>

      {/* Official institutional banner */}
      <PageContainer className="pt-6 pb-2">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <img
            src={bannerImg}
            alt="Career Katta and MITSC official institutional banner"
            width={1600}
            height={765}
            className="block h-auto w-full"
            style={{ aspectRatio: '1600/765' }}
          />
        </div>
      </PageContainer>

      {/* Activities grid */}
      <PageContainer className="py-10">
        <SectionHeading
          title={t('home.allActivities')}
          subtitle={t('home.chooseActivity')}
          className="mb-7"
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </PageContainer>

      <Footer />
    </div>
  )
}
