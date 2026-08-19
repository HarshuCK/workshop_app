interface SectionHeadingProps {
  title: string
  subtitle?: string
  className?: string
}

export function SectionHeading({ title, subtitle, className = '' }: SectionHeadingProps) {
  return (
    <div className={className}>
      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  )
}
