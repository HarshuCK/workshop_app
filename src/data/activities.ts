import type { LucideIcon } from 'lucide-react'
import {
  TrendingUp,
  Clock,
  PieChart,
  BarChart2,
  Wallet,
  CreditCard,
  MessageCircle,
  Layers,
  Rocket,
} from 'lucide-react'

export interface Activity {
  id: string
  number: number
  title: string
  shortDescription: string
  category: string
  route: string
  icon: LucideIcon
  colors: {
    iconBg: string
    iconText: string
    tagBg: string
    tagText: string
    cardBorder: string
  }
}

export const activities: Activity[] = [
  {
    id: 'future-money',
    number: 1,
    title: 'Future Money Calculator',
    shortDescription:
      'See how inflation erodes purchasing power and how saving builds real wealth over time.',
    category: 'Finance',
    route: '/activity/future-money',
    icon: TrendingUp,
    colors: {
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-600',
      tagBg: 'bg-emerald-50',
      tagText: 'text-emerald-700',
      cardBorder: 'hover:border-emerald-200',
    },
  },
  {
    id: 'day-scheduler',
    number: 2,
    title: '24-Hour Day Scheduler',
    shortDescription:
      'Allocate your 24 hours across activities and discover where time really goes.',
    category: 'Productivity',
    route: '/activity/day-scheduler',
    icon: Clock,
    colors: {
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      tagBg: 'bg-blue-50',
      tagText: 'text-blue-700',
      cardBorder: 'hover:border-blue-200',
    },
  },
  {
    id: 'salary-breakdown',
    number: 3,
    title: 'Salary Breakdown Simulator',
    shortDescription:
      'Break down a salary into taxes, deductions, and actual take-home pay.',
    category: 'Finance',
    route: '/activity/salary-breakdown',
    icon: PieChart,
    colors: {
      iconBg: 'bg-violet-100',
      iconText: 'text-violet-600',
      tagBg: 'bg-violet-50',
      tagText: 'text-violet-700',
      cardBorder: 'hover:border-violet-200',
    },
  },
  {
    id: 'compound-growth',
    number: 4,
    title: 'Compound Growth Playground',
    shortDescription:
      'Explore the magic of compounding and see how small amounts grow exponentially.',
    category: 'Finance',
    route: '/activity/compound-growth',
    icon: BarChart2,
    colors: {
      iconBg: 'bg-teal-100',
      iconText: 'text-teal-600',
      tagBg: 'bg-teal-50',
      tagText: 'text-teal-700',
      cardBorder: 'hover:border-teal-200',
    },
  },
  {
    id: '100-allocation',
    number: 5,
    title: '₹100 Allocation Challenge',
    shortDescription:
      'Allocate a limited budget across competing priorities and see trade-offs unfold.',
    category: 'Decision Making',
    route: '/activity/100-allocation',
    icon: Wallet,
    colors: {
      iconBg: 'bg-orange-100',
      iconText: 'text-orange-600',
      tagBg: 'bg-orange-50',
      tagText: 'text-orange-700',
      cardBorder: 'hover:border-orange-200',
    },
  },
  {
    id: 'emi',
    number: 6,
    title: 'EMI & Cost-of-Borrowing Simulator',
    shortDescription:
      'Calculate the real cost of loans, understand EMIs, and make smarter borrowing decisions.',
    category: 'Finance',
    route: '/activity/emi',
    icon: CreditCard,
    colors: {
      iconBg: 'bg-rose-100',
      iconText: 'text-rose-600',
      tagBg: 'bg-rose-50',
      tagText: 'text-rose-700',
      cardBorder: 'hover:border-rose-200',
    },
  },
  {
    id: 'communication',
    number: 7,
    title: 'Communication Distortion Experiment',
    shortDescription:
      'Experience how messages change as they pass through multiple people and layers.',
    category: 'Soft Skills',
    route: '/activity/communication',
    icon: MessageCircle,
    colors: {
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
      tagBg: 'bg-amber-50',
      tagText: 'text-amber-700',
      cardBorder: 'hover:border-amber-200',
    },
  },
  {
    id: 'resource-allocation',
    number: 8,
    title: 'Resource Allocation Challenge',
    shortDescription:
      'Distribute limited resources across a team or project and optimise for outcomes.',
    category: 'Management',
    route: '/activity/resource-allocation',
    icon: Layers,
    colors: {
      iconBg: 'bg-indigo-100',
      iconText: 'text-indigo-600',
      tagBg: 'bg-indigo-50',
      tagText: 'text-indigo-700',
      cardBorder: 'hover:border-indigo-200',
    },
  },
  {
    id: 'startup-economics',
    number: 9,
    title: 'Startup Unit Economics Simulator',
    shortDescription:
      'Change price, customers and costs to see how revenue, margins and break-even shift.',
    category: 'Entrepreneurship',
    route: '/activity/startup-economics',
    icon: Rocket,
    colors: {
      iconBg: 'bg-fuchsia-100',
      iconText: 'text-fuchsia-600',
      tagBg: 'bg-fuchsia-50',
      tagText: 'text-fuchsia-700',
      cardBorder: 'hover:border-fuchsia-200',
    },
  },
]
