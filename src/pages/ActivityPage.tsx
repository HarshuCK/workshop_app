import { useParams, useNavigate } from 'react-router-dom'
import { Construction } from 'lucide-react'
import { activities } from '../data/activities'
import { ActivityPageLayout } from '../components/ActivityPageLayout'
import { Header } from '../components/Header'
import { PageContainer } from '../components/PageContainer'
import { Button } from '../components/Button'
import { FutureMoneyCalculator } from '../activities/future-money/FutureMoneyCalculator'
import { DayScheduler } from '../activities/day-scheduler/DayScheduler'
import { RetirementSavings } from '../activities/retirement-savings/RetirementSavings'
import { CompoundGrowth } from '../activities/compound-growth/CompoundGrowth'
import { AllocationChallenge } from '../activities/allocation/AllocationChallenge'
import { EMISimulator } from '../activities/emi/EMISimulator'
import { CommunicationExperiment } from '../activities/communication/CommunicationExperiment'
import { ResourceChallenge } from '../activities/resource/ResourceChallenge'
import { StartupEconomics } from '../activities/startup/StartupEconomics'
import { useLanguage } from '../i18n/LanguageContext'

const WIDE_ACTIVITIES = new Set(['future-money', 'day-scheduler', 'retirement-savings', 'compound-growth', '100-allocation', 'emi', 'communication', 'resource-allocation', 'startup-economics'])

function PlaceholderContent() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
        <Construction className="h-6 w-6 text-amber-600" strokeWidth={1.75} />
      </div>
      <h2 className="mb-2 text-lg font-bold text-slate-900">{t('activityPage.comingNext')}</h2>
      <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500">
        {t('activityPage.comingNextDesc')}
      </p>
      <Button className="mt-6" variant="secondary" onClick={() => navigate('/')}>
        {t('activityPage.exploreOther')}
      </Button>
    </div>
  )
}

function ActivityContent({ id }: { id: string }) {
  if (id === 'future-money') return <FutureMoneyCalculator />
  if (id === 'day-scheduler') return <DayScheduler />
  if (id === 'retirement-savings') return <RetirementSavings />
  if (id === 'compound-growth') return <CompoundGrowth />
  if (id === '100-allocation') return <AllocationChallenge />
  if (id === 'emi') return <EMISimulator />
  if (id === 'communication') return <CommunicationExperiment />
  if (id === 'resource-allocation') return <ResourceChallenge />
  if (id === 'startup-economics') return <StartupEconomics />
  return <PlaceholderContent />
}

export default function ActivityPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const activity = activities.find((a) => a.id === id)

  if (!activity) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <PageContainer className="py-24 text-center">
          <p className="text-lg font-medium text-slate-400">{t('activityPage.notFound')}</p>
          <Button className="mt-5" onClick={() => navigate('/')}>
            {t('nav.goHome')}
          </Button>
        </PageContainer>
      </div>
    )
  }

  return (
    <ActivityPageLayout activity={activity} wide={WIDE_ACTIVITIES.has(activity.id)}>
      <ActivityContent id={activity.id} />
    </ActivityPageLayout>
  )
}
