import { useNavigate } from 'react-router-dom'
import type { Activity } from '../data/activities'
import { Button } from './Button'
import { useLanguage } from '../i18n/LanguageContext'

interface ActivityCardProps {
  activity: Activity
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const Icon = activity.icon

  const title = t(`activities.${activity.id}.title`)
  const shortDescription = t(`activities.${activity.id}.shortDescription`)
  const category = t(`activities.${activity.id}.category`)

  return (
    <article
      className={`flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${activity.colors.cardBorder}`}
    >
      {/* Icon + number row */}
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${activity.colors.iconBg}`}
        >
          <Icon className={`h-5 w-5 ${activity.colors.iconText}`} strokeWidth={2} />
        </div>
        <span className="text-xs font-semibold tabular-nums text-slate-400">
          {String(activity.number).padStart(2, '0')}
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-2 text-base font-bold leading-snug text-slate-900">
        {title}
      </h3>

      {/* Description */}
      <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-500">
        {shortDescription}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${activity.colors.tagBg} ${activity.colors.tagText}`}
        >
          {category}
        </span>
        <Button
          size="sm"
          onClick={() => navigate(activity.route)}
          aria-label={`Start ${title}`}
        >
          {t('activityCard.startActivity')}
        </Button>
      </div>
    </article>
  )
}
