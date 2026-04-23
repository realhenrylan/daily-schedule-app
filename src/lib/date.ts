import dayjs from 'dayjs'
import type { CourseEvent } from '../types'

export function startOfWeek(date: dayjs.Dayjs): dayjs.Dayjs {
  const day = date.day()
  const mondayOffset = day === 0 ? -6 : 1 - day
  return date.add(mondayOffset, 'day').startOf('day')
}

export function getWeekDays(baseDate: dayjs.Dayjs): dayjs.Dayjs[] {
  const start = startOfWeek(baseDate)
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'))
}

export function formatTimeRange(event: CourseEvent): string {
  const start = dayjs(event.start)
  const end = dayjs(event.end)
  return `${start.format('HH:mm')} - ${end.format('HH:mm')}`
}

export function isSameDate(dateA: string, dateB: dayjs.Dayjs): boolean {
  return dayjs(dateA).isSame(dateB, 'day')
}

export function sortByStart(events: CourseEvent[]): CourseEvent[] {
  return [...events].sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf())
}
