export interface ScheduleBlock {
  id: string
  name: string
  minutes: number
  color: string
}

export interface BlockTiming {
  id: string
  startMinutes: number
  endMinutes: number
  startTime: string
  endTime: string
}

export const TOTAL_DAY_MINUTES = 1440

export const COLORS = [
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#64748b', // slate
]

export const QUICK_LABELS = [
  'Sleep',
  'College / Classes',
  'Study',
  'Travel',
  'Meals',
  'Exercise',
  'Entertainment',
  'Social Media',
  'Work',
  'Friends / Family',
  'Personal Time',
  'Other',
]

const DEFAULT_ENTRIES = [
  { name: 'Sleep', minutes: 420 },
  { name: 'College / Classes', minutes: 360 },
  { name: 'Study', minutes: 120 },
  { name: 'Travel', minutes: 120 },
  { name: 'Meals', minutes: 90 },
  { name: 'Exercise', minutes: 60 },
  { name: 'Entertainment', minutes: 120 },
  { name: 'Other', minutes: 150 },
] // Total: 1440 ✓

export function buildDefaultSchedule(): ScheduleBlock[] {
  return DEFAULT_ENTRIES.map((e, i) => ({
    id: `default-${i}-${Math.random().toString(36).slice(2, 6)}`,
    name: e.name,
    minutes: e.minutes,
    color: COLORS[i % COLORS.length],
  }))
}

let _counter = 0
export function generateId(): string {
  return `block-${++_counter}-${Math.random().toString(36).slice(2, 6)}`
}

export function getNextColor(blocks: ScheduleBlock[]): string {
  return COLORS[blocks.length % COLORS.length]
}

export function getTotalMinutes(blocks: ScheduleBlock[]): number {
  return blocks.reduce((sum, b) => sum + b.minutes, 0)
}

export function getRemainingMinutes(blocks: ScheduleBlock[]): number {
  return Math.max(0, TOTAL_DAY_MINUTES - getTotalMinutes(blocks))
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0m'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function minutesToTimeStr(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function computeTimings(blocks: ScheduleBlock[]): BlockTiming[] {
  const timings: BlockTiming[] = []
  let cursor = 0
  for (const block of blocks) {
    timings.push({
      id: block.id,
      startMinutes: cursor,
      endMinutes: cursor + block.minutes,
      startTime: minutesToTimeStr(cursor),
      endTime: minutesToTimeStr(cursor + block.minutes),
    })
    cursor += block.minutes
  }
  return timings
}
